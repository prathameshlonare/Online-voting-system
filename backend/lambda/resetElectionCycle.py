################################################################################
# Lambda Function: resetElectionCycle
# Description: Resets election for a new cycle (clears votes, resets status)
# Trigger: API Gateway POST /election/reset
# Auth Required: Admin Only
# Tables: DynamoDB - Config, Votes
# Warning: This will delete all existing votes!
################################################################################
# resetElectionCycle Lambda
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
VOTES_TABLE_NAME = os.environ.get('VOTES_TABLE_NAME', 'Votes')
# Cognito Env Vars
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')

config_table = None
votes_table = None
try:
    if CONFIG_TABLE_NAME: config_table = dynamodb.Table(CONFIG_TABLE_NAME)
    if VOTES_TABLE_NAME: votes_table = dynamodb.Table(VOTES_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing DynamoDB table handles: {e}")

cognito_keys = None

try:
    if COGNITO_REGION and USER_POOL_ID:
        keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status(); cognito_keys = response.json()['keys']
        logger.info(f"Fetched {len(cognito_keys)} Cognito keys for resetElection.")
    else: logger.warning("Cognito env vars not set for resetElection key fetching.")
except Exception as e: logger.error(f"Failed to fetch Cognito keys for resetElection: {e}", exc_info=True)



def validate_admin_token(token_value):
    """Validates JWT token and checks if user belongs to admin group"""
    if not cognito_keys: raise ValueError("Admin token validation keys missing.")
    unverified_headers = jwt.get_unverified_headers(token_value); kid = unverified_headers.get('kid')
    if not kid: raise ValueError("Token kid missing.")
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data: raise ValueError("Public key not found for token kid.")
    public_key = jwk.construct(key_data)
    claims = jwt.decode( token_value, public_key.to_pem().decode('utf-8'), algorithms=[key_data.get('alg', 'RS256')], issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}', audience=COGNITO_APP_CLIENT_ID, options={ "verify_signature": True, "verify_aud": True, "verify_iat": True, "verify_exp": True, "verify_nbf": True, "verify_iss": True, "require_exp": True, "leeway": 60 })
    user_groups = claims.get('cognito:groups', [])
    if 'admin' not in user_groups: raise ValueError("User not authorized as admin.")
    logger.info(f"Admin user {claims.get('cognito:username')} validated (resetElection).")
    return claims

def lambda_handler(event, context):
    """
    Main Lambda handler - Resets election cycle
    1. Sets election status to NOT_STARTED
    2. Deletes all votes from Votes table
    """
    logger.info(f"Received event for resetElectionCycle: {json.dumps(event, indent=2)}")

    if not config_table or not votes_table or not cognito_keys:
        logger.error("One or more table handles or Cognito keys not initialized.")
        return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.")
        token = auth_header.split(' ')[1]
        validate_admin_token(token)

        # Step 1: Reset election status
        config_table.update_item(
            Key={'config_key': 'electionStatus'},
            UpdateExpression="set #v = :new_status, #lu = :now",
            ExpressionAttributeNames={'#v': 'value', '#lu': 'last_updated'},
            ExpressionAttributeValues={
                ':new_status': 'NOT_STARTED',
                ':now': datetime.now().isoformat()
            }
        )
        logger.info("Election status reset to NOT_STARTED.")

        # Step 2: Delete all votes using batch writer
        scan = votes_table.scan()
        with votes_table.batch_writer() as batch:
            for each in scan['Items']:
                batch.delete_item(
                    Key={
                        'student_id': each['student_id'],
                        'role_voted_for': each['role_voted_for']
                    }
                )

            while 'LastEvaluatedKey' in scan:
                scan = votes_table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])
                for each in scan['Items']:
                    batch.delete_item(Key={'student_id': each['student_id'], 'role_voted_for': each['role_voted_for']})
        
        logger.info("All items deleted from Votes table.")

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*','Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'},
            'body': json.dumps({'message': 'Election cycle has been reset. Old votes cleared and status set to NOT_STARTED.', 'newStatus': 'NOT_STARTED'})
        }

    except ValueError as ve:
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(ve)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as jwt_e:
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: Token error - {str(jwt_e)}'})}
    except ClientError as ce:
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f"Database error: {ce.response['Error']['Message']}"})}
    except Exception as e:
        logger.error(f"Error resetting election cycle: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Failed to reset election cycle: {str(e)}'})}
