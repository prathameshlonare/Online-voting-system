################################################################################
# Lambda Function: addCandidate
# Description: Adds a new candidate to the election (President/Secretary)
# Trigger: API Gateway POST /candidates
# Auth Required: Admin Only
# Table: DynamoDB - Candidates
################################################################################
#add candidate
import json
import boto3
import os
import logging
from jose import jwt 
from jose.utils import base64url_decode
from jose import jwk
import requests

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
CANDIDATES_TABLE_NAME = os.environ.get('CANDIDATES_TABLE_NAME', 'Candidates')
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID') 

try:
    candidates_table = dynamodb.Table(CANDIDATES_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing DynamoDB table handle for Candidates: {e}")
    candidates_table = None


cognito_keys = None
if COGNITO_REGION and USER_POOL_ID:
    keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
    try:
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
    except Exception as e:
        logger.error(f"Failed to fetch Cognito public keys for postCandidates: {e}")



def validate_admin_token(token_value):
    """Validates JWT token and checks if user belongs to admin group"""
    if not cognito_keys:
        logger.error("Cognito keys not loaded for admin token validation.")
        raise ValueError("Admin token validation keys missing.")
    
    unverified_headers = jwt.get_unverified_headers(token_value)
    kid = unverified_headers.get('kid')
    if not kid: raise ValueError("Token kid missing.")
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data: raise ValueError("Public key not found for token kid.")
    public_key = jwk.construct(key_data)

    claims = jwt.decode(
        token_value,
        public_key.to_pem().decode('utf-8'),
        algorithms=[key_data.get('alg', 'RS256')],
        issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}',
        audience=COGNITO_APP_CLIENT_ID, 
        options={ "verify_signature": True, "verify_aud": True, "verify_iat": True,
                  "verify_exp": True, "verify_nbf": True, "verify_iss": True,
                  "require_exp": True, "leeway": 60 }
    )
    

    user_groups = claims.get('cognito:groups', [])
    if 'admin' not in user_groups: 
        logger.warning(f"User {claims.get('cognito:username')} not in admin group. Groups: {user_groups}")
        raise ValueError("User not authorized as admin.")
    
    logger.info(f"Admin user {claims.get('cognito:username')} validated successfully.")
    return claims


def lambda_handler(event, context):
    """
    Main Lambda handler
    Expected body: { "role": "President|Secretary", "candidate_id": "...", "name": "...", "party": "..." }
    """
    logger.info(f"Received event for postCandidates: {json.dumps(event)}")

    if not candidates_table:
        logger.error("Candidates table not initialized for postCandidates.")
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server configuration error.'})}


    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization'))
        if not auth_header or not auth_header.lower().startswith('bearer '):
            raise ValueError("Authorization header missing or malformed.")
        
        token = auth_header.split(' ')[1]
        validate_admin_token(token) 
    except Exception as auth_error:
        logger.error(f"Admin Authorization Error: {auth_error}")
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(auth_error)}'})}


    try:
        body = json.loads(event.get('body', '{}'))
        role = body.get('role')
        candidate_id = body.get('candidate_id')
        name = body.get('name')
        party = body.get('party')

        if not all([role, candidate_id, name, party]):
            logger.error(f"Missing fields in request body: {body}")
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Missing required fields: role, candidate_id, name, party'})}


        candidates_table.put_item(
            Item={
                'role': role, 
                'candidate_id': candidate_id, 
                'name': name,
                'party': party,
            }
        )
        logger.info(f"Successfully added candidate: {candidate_id} for role {role}")
        return {
            'statusCode': 201, 
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'message': f'Candidate {name} added successfully for role {role}.'})
        }

    except Exception as e:
        logger.error(f"Error processing add candidate request: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Internal server error: {str(e)}'})}
