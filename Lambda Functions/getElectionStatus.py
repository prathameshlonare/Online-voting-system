################################################################################
# Lambda Function: getElectionStatus
# Description: Retrieves current election status
# Trigger: API Gateway GET /election/status
# Auth Required: Optional (Public for students, Admin for full details)
# Table: DynamoDB - Config
# Status Values: NOT_STARTED, RUNNING, STOPPED, RESULTS_DECLARED
################################################################################
#getelectionstatus
import json
import boto3
import os
import logging
import requests
from jose import jwk, jwt
from jose.utils import base64url_decode
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
CONFIG_TABLE_NAME = os.environ.get('CONFIG_TABLE_NAME', 'Config')
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID') 

config_table = None
try:
    if CONFIG_TABLE_NAME:
        config_table = dynamodb.Table(CONFIG_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing Config table in getElectionStatus: {e}")

# Fetch Cognito public keys for token validation
cognito_keys = None
try:
    if COGNITO_REGION and USER_POOL_ID:
        keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        logger.info(f"Fetching Cognito keys from: {keys_url}")
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
        logger.info(f"Successfully fetched {len(cognito_keys)} Cognito public keys for getElectionStatus.")
    else:
        logger.warning("COGNITO_REGION or COGNITO_USER_POOL_ID env var not set. Cannot fetch keys for getElectionStatus.")
except Exception as e:
    logger.error(f"Failed to fetch Cognito public keys for getElectionStatus: {e}", exc_info=True)

def validate_admin_token(token_value):
    """Validates JWT token and checks if user belongs to admin group"""
    if not cognito_keys:
        logger.error("Cognito keys not loaded for admin token validation (getElectionStatus).")
        raise ValueError("Admin token validation keys missing.")
    unverified_headers = jwt.get_unverified_headers(token_value)
    kid = unverified_headers.get('kid')
    if not kid: raise ValueError("Token kid missing.")
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data: raise ValueError("Public key not found for token kid.")
    public_key = jwk.construct(key_data)
    claims = jwt.decode( token_value, public_key.to_pem().decode('utf-8'), algorithms=[key_data.get('alg', 'RS256')], issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}', audience=COGNITO_APP_CLIENT_ID, options={ "verify_signature": True, "verify_aud": True, "verify_iat": True, "verify_exp": True, "verify_nbf": True, "verify_iss": True, "require_exp": True, "leeway": 60 } )
    user_groups = claims.get('cognito:groups', [])
    if 'admin' not in user_groups:
        logger.warning(f"User {claims.get('cognito:username')} not in admin group (getElectionStatus). Groups: {user_groups}")
        raise ValueError("User not authorized as admin.")
    logger.info(f"Admin user {claims.get('cognito:username')} validated successfully (getElectionStatus).")
    return claims


def lambda_handler(event, context):
    """
    Main Lambda handler - Returns current election status
    Can be called without auth (returns basic status)
    Or with admin token (returns extended status)
    """
    logger.info(f"Received event for getElectionStatus: {json.dumps(event, indent=2)}")

    if not config_table:
        logger.error("Config table not initialized in getElectionStatus handler.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}

    is_admin_call = False 
    
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))

        # Check if admin token is provided
        if auth_header and auth_header.lower().startswith('bearer '):
            logger.info("Authorization header found. Attempting to validate as admin.")
            if not cognito_keys:
                 logger.error("Cognito keys not available for admin token validation attempt.")
                 return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server auth configuration error (keys missing).'})}

            token = auth_header.split(' ')[1]
            try:
                validate_admin_token(token) 
                is_admin_call = True 
                logger.info("Request validated as ADMIN request.")
            except ValueError as admin_val_error:
                # Token present but not admin - treat as student
                logger.info(f"Token present but not a valid admin token (expected for students): {admin_val_error}. Treating as public.")
                is_admin_call = False 
            except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as jwt_e_val:
                logger.error(f"Invalid/Expired token in Authorization header: {jwt_e_val}")
                return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Invalid or expired token - {str(jwt_e_val)}'})}
        else:
            logger.info("No Authorization header. Treating as PUBLIC request.")
            is_admin_call = False 

        # Fetch election status from Config table
        response = config_table.get_item(Key={'config_key': 'electionStatus'})
        current_status = 'NOT_STARTED' 
        if 'Item' in response and 'value' in response['Item']:
            current_status = response['Item']['value']

        logger.info(f"Access type: {'Admin' if is_admin_call else 'Public'}, Status: {current_status}")
        
        response_body = {'status': current_status}

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'OPTIONS,GET'},
            'body': json.dumps(response_body)
        }
        
    
    except ClientError as ce:
        logger.error(f"DynamoDB ClientError in getElectionStatus: {ce.response['Error']['Message']}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f"Database error: {ce.response['Error']['Message']}"})}
    except Exception as e:
        logger.error(f"Unexpected error in getElectionStatus: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Failed to get status: {str(e)}'})}
