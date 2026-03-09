################################################################################
# Lambda Function: submitVote
# Description: Submits student vote for President and Secretary
# Trigger: API Gateway POST /vote
# Auth Required: Yes (Authenticated student)
# Tables: DynamoDB - Votes, Config
# Validations: Checks election is RUNNING, student hasn't voted yet
################################################################################
# submitVote Lambda Function

import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError 

# Configure logging
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


import requests
from jose import jwk, jwt
from jose.utils import base64url_decode



dynamodb = boto3.resource('dynamodb')
VOTES_TABLE_NAME = os.environ.get('VOTES_TABLE_NAME', 'Votes')
CONFIG_TABLE_NAME = os.environ.get('CONFIG_TABLE_NAME', 'Config') 

USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID') 



votes_table = None
config_table = None
try:
    if VOTES_TABLE_NAME:
        votes_table = dynamodb.Table(VOTES_TABLE_NAME)
    if CONFIG_TABLE_NAME:
        config_table = dynamodb.Table(CONFIG_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing DynamoDB table handles: {e}")

cognito_keys = None

if COGNITO_REGION and USER_POOL_ID:
    keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
    try:
        logger.info(f"Fetching Cognito keys from: {keys_url}")
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
        logger.info(f"Successfully fetched {len(cognito_keys)} Cognito public keys for submitVote.")
    except Exception as e:
        logger.error(f"Failed to fetch Cognito public keys for submitVote: {e}", exc_info=True)
else:
    logger.warning("Cognito env vars not set for submitVote key fetching.")



def validate_user_token(token_value):
    """Validates JWT token from student"""
    if not cognito_keys: raise ValueError("Token validation keys missing.")
    unverified_headers = jwt.get_unverified_headers(token_value)
    kid = unverified_headers.get('kid')
    if not kid: raise ValueError("Token kid missing.")
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data: raise ValueError("Public key not found for token kid.")
    public_key = jwk.construct(key_data)
    claims = jwt.decode( token_value, public_key.to_pem().decode('utf-8'), algorithms=[key_data.get('alg', 'RS256')], issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}', audience=COGNITO_APP_CLIENT_ID, options={ "verify_signature": True, "verify_aud": True, "verify_iat": True, "verify_exp": True, "verify_nbf": True, "verify_iss": True, "require_exp": True, "leeway": 60 })
    logger.info(f"User token validated successfully for submitVote. User: {claims.get('cognito:username')}")
    return claims



def lambda_handler(event, context):
    """
    Main Lambda handler - Processes student vote submission
    Validates:
    1. User is authenticated
    2. Election is RUNNING
    3. Student hasn't voted yet for each position
    """
    logger.info(f"Received event for submitVote: {json.dumps(event)}")


    if not votes_table or not config_table:
        logger.error("DynamoDB table handles (Votes or Config) not initialized.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}
    if not cognito_keys:
        logger.fatal("Cognito public keys not loaded.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Service temporarily unavailable (keys).'})}


    claims = None 


    try:

        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.") 

        token = auth_header.split(' ')[1]
        claims = validate_user_token(token) 



        # Check if election is RUNNING
        logger.info(f"Checking election status from table: {CONFIG_TABLE_NAME}")
        status_response = config_table.get_item(Key={'config_key': 'electionStatus'})
        current_status = 'NOT_STARTED'
        if 'Item' in status_response and 'value' in status_response['Item']:
            current_status = status_response['Item']['value']

        if current_status != 'RUNNING':
             logger.warning(f"Vote submission aborted. Election status is: {current_status}")

             return {
                 'statusCode': 403,
                 'headers': { 'Access-Control-Allow-Origin': '*' },
                 'body': json.dumps({'error': f'Voting is currently closed (Status: {current_status}).'})
             }
        logger.info("Election status is RUNNING. Proceeding.")



        # Parse vote data
        body = json.loads(event.get('body', '{}'))
        student_id_from_body = body.get('student_id')
        president_candidate_id = body.get('president_candidate_id')
        secretary_candidate_id = body.get('secretary_candidate_id')



        # Get student_id from token (more secure)
        student_id_from_token = claims.get('custom:student_id')
        if not student_id_from_token:
            logger.error("Validated token is missing 'custom:student_id' claim.")
            return {'statusCode': 403, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden: User profile incomplete.'})}

        if student_id_from_body and student_id_from_body != student_id_from_token:
            logger.warning(f"Mismatch: student_id in body ({student_id_from_body}) vs token ({student_id_from_token}). Using token's ID.")
        current_student_id = student_id_from_token
        logger.info(f"Processing vote for student_id from token: {current_student_id}")



        # Validate required fields
        if not current_student_id or not president_candidate_id or not secretary_candidate_id:
            logger.error(f"Missing fields after parsing: student={current_student_id}, pres={president_candidate_id}, sec={secretary_candidate_id}")
            return { "statusCode": 400, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": "Missing student_id or candidate selections."}) }


        # Check if already voted for President
        pres_vote_key = {'student_id': current_student_id, 'role_voted_for': 'President'}
        existing_pres_vote = votes_table.get_item(Key=pres_vote_key)
        if 'Item' in existing_pres_vote:
             logger.warning(f"Student {current_student_id} already voted for President.")
             return { "statusCode": 409, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": "You have already voted for President."})}

        # Check if already voted for Secretary
        sec_vote_key = {'student_id': current_student_id, 'role_voted_for': 'Secretary'}
        existing_sec_vote = votes_table.get_item(Key=sec_vote_key)
        if 'Item' in existing_sec_vote:
             logger.warning(f"Student {current_student_id} already voted for Secretary.")
             return { "statusCode": 409, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": "You have already voted for Secretary."})}



        # Record votes using batch writer
        timestamp = datetime.now().isoformat()

        with votes_table.batch_writer() as batch:
            # President vote
            item_pres = {
                'student_id': current_student_id, 'role_voted_for': 'President',
                'candidate_id': president_candidate_id, 'timestamp': timestamp
            }
            batch.put_item(Item=item_pres)
            logger.info(f"Prepared President vote: {item_pres}")

            # Secretary vote
            item_sec = {
                'student_id': current_student_id, 'role_voted_for': 'Secretary',
                'candidate_id': secretary_candidate_id, 'timestamp': timestamp
            }
            batch.put_item(Item=item_sec)
            logger.info(f"Prepared Secretary vote: {item_sec}")

        logger.info(f"Votes successfully recorded for student {current_student_id}.")



        return {
            "statusCode": 200,
            "headers": { "Access-Control-Allow-Origin": "*" },
            "body": json.dumps({"message": "Votes for President and Secretary submitted successfully."})
        }


    except ValueError as e: 
         logger.error(f"Authorization or Value Error: {str(e)}")
         return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(e)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as e: 
         logger.error(f"JWT Token Error: {str(e)}")
         return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Invalid or expired token - {str(e)}.'})}
    except ClientError as e: 
        error_code = e.response.get('Error', {}).get('Code')
        error_message = e.response.get('Error', {}).get('Message')
        logger.error(f"AWS ClientError: {error_code} - {error_message}", exc_info=True)

        return { "statusCode": 500, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": f"A database error occurred: {error_message}"})}
    except json.JSONDecodeError: 
        logger.error("Invalid JSON in request body.", exc_info=True)
        return { "statusCode": 400, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": "Invalid request body format."})}
    except Exception as e: 
        logger.error(f"Unexpected error during vote submission: {e}", exc_info=True)
        return { "statusCode": 500, "headers": { "Access-Control-Allow-Origin": "*" }, "body": json.dumps({"error": f'An internal server error occurred.'})}
