################################################################################
# Lambda Function: checkEligibility
# Description: Checks if a student is eligible to vote based on attendance
# Trigger: API Gateway GET /eligibility
# Auth Required: Yes (Student)
# Tables: DynamoDB - Config, S3 - Attendance CSV
################################################################################
#checkeligibility
import json
import boto3
import os
import logging
import csv
import io
import requests
from decimal import Decimal, InvalidOperation 
from botocore.exceptions import ClientError
from jose import jwk, jwt
from jose.utils import base64url_decode


logger = logging.getLogger()
logger.setLevel(logging.INFO)

CONFIG_TABLE_NAME = os.environ.get('CONFIG_TABLE_NAME', 'Config')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
S3_ATTENDANCE_FILE_KEY = os.environ.get('S3_ATTENDANCE_FILE_KEY')
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

STUDENT_ID_COL = 'student_id'
ATTENDANCE_COL = 'attendance_percentage' 

cognito_keys = None
try:
    if COGNITO_REGION and USER_POOL_ID:
        keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        logger.info(f"Fetching Cognito keys from: {keys_url}")
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status() 
        cognito_keys = response.json()['keys']
        logger.info(f"Successfully fetched {len(cognito_keys)} Cognito public keys.")
    else:
        logger.warning("COGNITO_REGION or COGNITO_USER_POOL_ID env var not set. Cannot fetch keys.")
except requests.exceptions.Timeout:
    logger.error(f"Timeout fetching Cognito keys from {keys_url}")
except requests.exceptions.RequestException as e:
    logger.error(f"RequestException fetching Cognito keys: {e}", exc_info=True)
except json.JSONDecodeError:
    logger.error(f"JSONDecodeError fetching Cognito keys from {keys_url}")
except KeyError:
    logger.error(f"Cognito keys response from {keys_url} missing 'keys' field.")



def lambda_handler(event, context):
    """
    Main Lambda handler - Checks student eligibility based on attendance
    Returns: { isEligible: boolean, reason: string, attendancePercentage: number }
    """
    logger.info(f"Received event for checkEligibility: {json.dumps(event, indent=2)}")


    if not cognito_keys:
        logger.fatal("CRITICAL: Cognito public keys not loaded. Check initialization.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Service temporarily unavailable (auth keys).'})}
    if not all([USER_POOL_ID, COGNITO_APP_CLIENT_ID, COGNITO_REGION, CONFIG_TABLE_NAME, S3_BUCKET_NAME, S3_ATTENDANCE_FILE_KEY]):
        logger.fatal("CRITICAL: One or more essential environment variables are missing.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Service temporarily unavailable (config).'})}

    claims = None
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.")
        token = auth_header.split(' ')[1]

        unverified_headers = jwt.get_unverified_headers(token)
        kid = unverified_headers.get('kid')
        if not kid: raise ValueError("Token header missing 'kid'.")
        key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
        if not key_data: raise ValueError(f"Public key not found for token kid: {kid}.")
        
        public_key = jwk.construct(key_data)
        claims = jwt.decode(
            token, public_key.to_pem().decode('utf-8'),
            algorithms=[key_data.get('alg', 'RS256')],
            issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}',
            audience=COGNITO_APP_CLIENT_ID,
            options={"verify_signature": True, "verify_aud": True, "verify_iat": True,
                     "verify_exp": True, "verify_nbf": True, "verify_iss": True,
                     "require_exp": True, "require_sub": True, "leeway": 60}
        )
        logger.info(f"Token validated for user: {claims.get('cognito:username')}")

        config_table = dynamodb.Table(CONFIG_TABLE_NAME)
        logger.info(f"Checking election status from table: {CONFIG_TABLE_NAME}")
        status_response = config_table.get_item(Key={'config_key': 'electionStatus'})
        current_status = 'NOT_STARTED'
        if 'Item' in status_response and 'value' in status_response['Item']:
            current_status = status_response['Item']['value']

        if current_status != 'RUNNING':
            logger.warning(f"Eligibility check aborted. Election status is: {current_status}")
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'isEligible': False, 'reason': f'Voting is currently closed (Status: {current_status}).', 'attendancePercentage': None})}
        logger.info("Election status is RUNNING.")

        student_id_from_token = claims.get('custom:student_id')
        if not student_id_from_token:
            logger.error("Token missing 'custom:student_id' claim.")
            return {'statusCode': 403, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden: User profile incomplete.'})}
        student_id = student_id_from_token.strip() 
        logger.info(f"Processing eligibility for student_id from token: {student_id}")

        logger.info(f"Fetching threshold from table: {CONFIG_TABLE_NAME}")
        config_response = config_table.get_item(Key={'config_key': 'threshold'})
        if 'Item' in config_response and 'value' in config_response['Item'] and config_response['Item']['value'] is not None:
            threshold = float(config_response['Item']['value'])
            logger.info(f"Attendance threshold: {threshold}")
        else:
            logger.error("Attendance threshold not found or invalid in Config table.")
            return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Service configuration error (threshold).'})}

        student_attendance_percentage = Decimal('-1') 
        s3_file_path = f"s3://{S3_BUCKET_NAME}/{S3_ATTENDANCE_FILE_KEY}"
        logger.info(f"Reading attendance file: {s3_file_path}")
        
        try:
            s3_response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=S3_ATTENDANCE_FILE_KEY)
            csv_content = s3_response['Body'].read().decode('utf-8-sig')
            logger.info(f"Read {len(csv_content)} bytes from S3.")

            if not csv_content.strip():
                logger.warning(f"Attendance CSV file is empty: {s3_file_path}")
            else:
                csvfile = io.StringIO(csv_content)
                reader = csv.DictReader(csvfile)
                found_student = False
                for i, row in enumerate(reader):
                    row_student_id = row.get(STUDENT_ID_COL, '').strip()
                    if not row_student_id:
                        logger.warning(f"Skipping CSV row {i+1} due to missing student_id.")
                        continue

                    if row_student_id.lower() == student_id.lower():
                        found_student = True
                        logger.info(f"Found matching student_id '{student_id}' in CSV at row {i+1}.")
                        attendance_str = row.get(ATTENDANCE_COL, '').strip()
                        if attendance_str:
                            try:
                                if attendance_str.endswith('%'):
                                    attendance_str = attendance_str[:-1]
                                student_attendance_percentage = Decimal(attendance_str)
                                logger.info(f"Attendance for {student_id}: {student_attendance_percentage}%")
                            except InvalidOperation: 
                                logger.error(f"Invalid attendance value '{row.get(ATTENDANCE_COL)}' for {student_id}.", exc_info=True)
                        else:
                            logger.warning(f"Attendance data missing for {student_id} in CSV.")
                        break 
                
                if not found_student:
                    logger.warning(f"Student ID {student_id} not found in CSV.")
        
        except s3_client.exceptions.NoSuchKey:
            logger.error(f"S3 attendance file not found: {s3_file_path}", exc_info=True)
        except ClientError as e: 
            logger.error(f"S3 ClientError reading file: {e.response['Error']['Message']}", exc_info=True)
            return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Failed to access attendance data.'})}
        except UnicodeDecodeError as e:
            logger.error(f"Encoding error reading S3 file: {e}", exc_info=True)
            return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Attendance file encoding error.'})}
        except Exception as e: 
            logger.error(f"Error processing S3 attendance file: {e}", exc_info=True)
            return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Error processing attendance data.'})}

        is_eligible = False
        reason = "Eligibility could not be determined."

        if student_attendance_percentage >= 0:
            if student_attendance_percentage >= threshold:
                is_eligible = True
                reason = "You are eligible to vote based on attendance."
            else:
                reason = f"Your attendance ({float(student_attendance_percentage)}%) is below the required threshold ({threshold}%)."
        else: 
            reason = f"Your Student ID ({student_id}) was not found in the attendance record, or attendance data was missing/invalid."


        logger.info(f"Final eligibility for {student_id}: isEligible={is_eligible}, Reason='{reason}', Attendance={student_attendance_percentage}")

        response_body = {
            'isEligible': is_eligible,
            'reason': reason,
            'attendancePercentage': float(student_attendance_percentage) if student_attendance_percentage >= 0 else None
        }
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'OPTIONS,GET'}, 'body': json.dumps(response_body)}

    except ValueError as e: 
        logger.error(f"Authorization/Value Error: {str(e)}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(e)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as e: 
        logger.error(f"JWT Token Error: {str(e)}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Token issue - {str(e)}.'})}
    except ClientError as e: 
        error_msg = e.response.get('Error', {}).get('Message', 'Unknown AWS SDK error')
        logger.error(f"AWS ClientError in handler: {error_msg}", exc_info=True)
        return {"statusCode": 500, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": f"AWS service error: {error_msg}"})}
    except Exception as e: 
        logger.error(f"Unexpected error in checkEligibility handler: {e}", exc_info=True)
        return {"statusCode": 500, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": 'An unexpected internal server error occurred.'})}
