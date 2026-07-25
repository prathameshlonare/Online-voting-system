################################################################################
# Lambda Function: startElection
# Description: Starts the election (changes status to RUNNING)
# Trigger: API Gateway POST /election/start
# Auth Required: Admin Only
# Table: DynamoDB - Config
# Note: Uses conditional update to prevent starting if already running
################################################################################
# startElection Lambda
import json
import boto3
import os
import logging
from datetime import datetime
import requests
from jose import jwk, jwt
from jose.utils import base64url_decode
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
CONFIG_TABLE_NAME = os.environ.get('CONFIG_TABLE_NAME', 'Config')
# Cognito Env Vars
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')

config_table = None
try:
    if CONFIG_TABLE_NAME:
        config_table = dynamodb.Table(CONFIG_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing Config table in startElection: {e}")

cognito_keys = None

try:
    if COGNITO_REGION and USER_POOL_ID:
        keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
        logger.info(f"Successfully fetched {len(cognito_keys)} Cognito public keys for startElection.")
    else: logger.warning("Cognito env vars not set for startElection key fetching.")
except Exception as e: logger.error(f"Failed to fetch Cognito public keys for startElection: {e}", exc_info=True)



def validate_admin_token(token_value):
    """Validates JWT token and checks if user belongs to admin group"""
    if not cognito_keys: raise ValueError("Admin token validation keys missing.")
    unverified_headers = jwt.get_unverified_headers(token_value)
    kid = unverified_headers.get('kid')
    if not kid: raise ValueError("Token kid missing.")
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data: raise ValueError("Public key not found for token kid.")
    public_key = jwk.construct(key_data)
    claims = jwt.decode( token_value, public_key.to_pem().decode('utf-8'), algorithms=[key_data.get('alg', 'RS256')], issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}', audience=COGNITO_APP_CLIENT_ID, options={ "verify_signature": True, "verify_aud": True, "verify_iat": True, "verify_exp": True, "verify_nbf": True, "verify_iss": True, "require_exp": True, "leeway": 60 })
    user_groups = claims.get('cognito:groups', [])
    if 'admin' not in user_groups: raise ValueError("User not authorized as admin.")
    logger.info(f"Admin user {claims.get('cognito:username')} validated successfully (startElection).")
    return claims


def lambda_handler(event, context):
    """
    Main Lambda handler - Starts the election
    Uses conditional update to prevent starting if already RUNNING
    """
    logger.info(f"Received event for startElection: {json.dumps(event, indent=2)}")

    if not config_table or not cognito_keys : 
        logger.error("Config table or Cognito keys not initialized in startElection handler.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.")
        token = auth_header.split(' ')[1]
        validate_admin_token(token)

        # Conditional update - only if not already running
        response = config_table.update_item(
            Key={'config_key': 'electionStatus'},
            UpdateExpression="set #v = :new_status, #lu = :now",
            ConditionExpression="#v <> :running_status",
            ExpressionAttributeNames={'#v': 'value', '#lu': 'last_updated'},
            ExpressionAttributeValues={
                ':new_status': 'RUNNING',
                ':running_status': 'RUNNING',
                ':now': datetime.now().isoformat()
            },
            ReturnValues="UPDATED_NEW"
        )
        logger.info(f"Election status updated to RUNNING: {response}")
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*','Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'},
            'body': json.dumps({'message': 'Election started successfully.', 'newStatus': 'RUNNING'})
        }
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        logger.warning("ConditionalCheckFailed: Election might already be running (startElection).")
        return {'statusCode': 409, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Election is already running or in a state that prevents starting.'})} # 409 Conflict
    except ValueError as ve:
        logger.error(f"Auth Value Error in startElection: {ve}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(ve)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as jwt_e:
        logger.error(f"JWT Error in startElection: {jwt_e}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Token validation failed - {str(jwt_e)}'})}
    except ClientError as ce:
        logger.error(f"DynamoDB ClientError in startElection: {ce.response['Error']['Message']}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f"Database error: {ce.response['Error']['Message']}"})}
    except Exception as e:
        logger.error(f"Error starting election: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Failed to start election: {str(e)}'})}
