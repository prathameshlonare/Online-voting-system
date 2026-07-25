################################################################################
# Lambda Function: declareResults
# Description: Declares election results (changes status to RESULTS_DECLARED)
# Trigger: API Gateway POST /election/declare
# Auth Required: Admin Only
# Table: DynamoDB - Config
# Note: Election must be in STOPPED state before declaring results
################################################################################
# declareResults 
import json
import boto3
import os
import logging
from datetime import datetime, timezone 
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
    logger.error(f"Error initializing Config table in declareResults: {e}")

cognito_keys = None
try:
    if COGNITO_REGION and USER_POOL_ID:
        keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
        logger.info(f"Fetched {len(cognito_keys)} Cognito keys for declareResults.")
    else: logger.warning("Cognito env vars not set for declareResults key fetching.")
except Exception as e: logger.error(f"Failed to fetch Cognito keys for declareResults: {e}", exc_info=True)

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
    logger.info(f"Admin user {claims.get('cognito:username')} validated (declareResults).")
    return claims

def lambda_handler(event, context):
    """
    Main Lambda handler - Declares election results
    Uses conditional update to ensure election is in STOPPED state
    """
    logger.info(f"Received event for declareResults: {json.dumps(event, indent=2)}")

    if not config_table or not cognito_keys:
        logger.error("Config table or Cognito keys not initialized in declareResults.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.")
        token = auth_header.split(' ')[1]
        validate_admin_token(token)

        # DynamoDB conditional update - ensures election was STOPPED
        response = config_table.update_item(
            Key={'config_key': 'electionStatus'},
            UpdateExpression="set #v = :new_status, #lu = :now", 
            ConditionExpression="#v = :stopped_status", 
            ExpressionAttributeNames={
                '#v': 'value',         
                '#lu': 'last_updated'  
            },
            ExpressionAttributeValues={
                ':new_status': 'RESULTS_DECLARED',
                ':stopped_status': 'STOPPED',
                ':now': datetime.now(timezone.utc).isoformat() 
            },
            ReturnValues="UPDATED_NEW" 
        )
        
        logger.info(f"Election status updated to RESULTS_DECLARED: {response}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token', 
                'Access-Control-Allow-Methods': 'OPTIONS,POST' 
            },
            'body': json.dumps({
                'message': 'Results declared successfully and election status updated.', 
                'newStatus': 'RESULTS_DECLARED' 
            })
        }

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning("ConditionalCheckFailed: Election was not in 'STOPPED' state when trying to declare results.")
            current_status = 'UNKNOWN'
            try:
                if config_table:
                    status_item_response = config_table.get_item(Key={'config_key': 'electionStatus'})
                    if 'Item' in status_item_response and 'value' in status_item_response['Item']:
                        current_status = status_item_response['Item']['value']
            except Exception as status_fetch_e:
                logger.error(f"Error fetching current status after ConditionalCheckFailedException: {status_fetch_e}")
            
            return {
                'statusCode': 409, 
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'Cannot declare results. Election status is currently "{current_status}". It must be "STOPPED" before declaring results.',
                    'currentStatus': current_status 
                })
            }
        else:
            logger.error(f"DynamoDB ClientError in declareResults: {e.response['Error']['Message']}", exc_info=True)
            return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f"Database error: {e.response['Error']['Message']}"})}
            
    except ValueError as ve:
        logger.error(f"Auth Value Error in declareResults: {ve}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(ve)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as jwt_e:
        logger.error(f"JWT Error in declareResults: {jwt_e}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Token error - {str(jwt_e)}'})}
    except Exception as e:
        logger.error(f"Error declaring results: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Failed to declare results: {str(e)}'})}
