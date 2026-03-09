################################################################################
# Lambda Function: getVotingResults
# Description: Aggregates and returns voting results
# Trigger: API Gateway GET /results
# Auth Required: Yes (Authenticated users only)
# Tables: DynamoDB - Votes, Candidates
# Returns: Vote counts grouped by role (President, Secretary)
################################################################################
#getvotingresults
import json
import boto3
import os
from collections import defaultdict 
from decimal import Decimal 
import logging
import requests 
from jose import jwk, jwt 
from jose.utils import base64url_decode 
from botocore.exceptions import ClientError 

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

VOTES_TABLE_NAME = os.environ.get('VOTES_TABLE_NAME', 'Votes') 
CANDIDATES_TABLE_NAME = os.environ.get('CANDIDATES_TABLE_NAME', 'Candidates') 

USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'us-east-1')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID') 

votes_table = None
candidates_table = None
try:
    if VOTES_TABLE_NAME:
        votes_table = dynamodb.Table(VOTES_TABLE_NAME)
    if CANDIDATES_TABLE_NAME:
        candidates_table = dynamodb.Table(CANDIDATES_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing DynamoDB tables in getVotingResults: {e}")


cognito_keys = None
if COGNITO_REGION and USER_POOL_ID:
    keys_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
    try:
        logger.info(f"Fetching Cognito keys from: {keys_url} for getVotingResults")
        response = requests.get(keys_url, timeout=5)
        response.raise_for_status()
        cognito_keys = response.json()['keys']
        logger.info(f"Successfully fetched {len(cognito_keys)} Cognito public keys.")
    except Exception as e:
        logger.error(f"Failed to fetch Cognito public keys for getVotingResults: {e}", exc_info=True)
else:
    logger.warning("Cognito env vars not set for getVotingResults key fetching.")


def validate_authenticated_token(token_value):
    """Validates JWT token for authenticated access"""
    if not cognito_keys:
        logger.error("Cognito keys not loaded for token validation.")
        raise ValueError("Token validation keys are missing. Server configuration issue.")
        
    unverified_headers = jwt.get_unverified_headers(token_value)
    kid = unverified_headers.get('kid')
    if not kid: 
        logger.error("Token 'kid' (Key ID) missing in header.")
        raise ValueError("Token 'kid' (Key ID) is missing in the header.")
    
    key_data = next((k for k in cognito_keys if k['kid'] == kid), None)
    if not key_data:
        logger.error(f"Public key not found in JWKS for token kid: {kid}")
        raise ValueError(f"Public key not found for token kid: {kid}.")
    
    public_key = jwk.construct(key_data)

    try:
        claims = jwt.decode(
            token_value, 
            public_key.to_pem().decode('utf-8'), 
            algorithms=[key_data.get('alg', 'RS256')], 
            issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}', 
            audience=COGNITO_APP_CLIENT_ID, 
            options={ 
                "verify_signature": True, "verify_aud": True, "verify_iat": True,
                "verify_exp": True, "verify_nbf": True, "verify_iss": True,
                "require_exp": True, "leeway": 60 
            }
        )
    except Exception as e:
        logger.error(f"JWT Decode/Validation Error: {str(e)}")
        raise ValueError(f"Token decode/validation failed: {str(e)}")

    logger.info(f"Authenticated user {claims.get('cognito:username')} validated successfully for results access.")
    return claims 


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle DynamoDB Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return json.JSONEncoder.default(self, obj)

def lambda_handler(event, context):
    """
    Main Lambda handler - Returns aggregated voting results
    Requires authentication
    """
    logger.info(f"Received event for getVotingResults (Authenticated Access Expected): {json.dumps(event)}")

    if not cognito_keys:
         logger.error("Cognito keys not loaded. Cannot perform token validation.")
         return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Authentication service unavailable.'})}

    
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization')) 
        
        
        if not auth_header or not auth_header.lower().startswith('bearer '):
            logger.warning("Authorization header missing or malformed for authenticated access.")
            raise ValueError("Authorization header missing or malformed.") 

        token = auth_header.split(' ')[1] 
        
        user_claims = validate_authenticated_token(token) 
        logger.info(f"Authentication successful for user: {user_claims.get('cognito:username')}")
        

    except ValueError as ve: 
        logger.error(f"Authentication Value Error in getVotingResults: {ve}", exc_info=True)
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Unauthorized: {str(ve)}'})}
    except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, jwt.JWTError) as jwt_e: 
        logger.error(f"JWT Token Error in getVotingResults: {jwt_e}", exc_info=True)
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Token Error: {str(jwt_e)}'})}
    except Exception as e: 
        logger.error(f"Unexpected error during authentication step in getVotingResults: {e}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'Internal server error during authentication.'})}
    

    # Fetch and aggregate results
    try:
        votes_table_handle = dynamodb.Table(VOTES_TABLE_NAME)
        candidates_table_handle = dynamodb.Table(CANDIDATES_TABLE_NAME)

        if not votes_table_handle or not candidates_table_handle:
            logger.error("One or both DynamoDB tables could not be initialized.")
            return {'statusCode': 503, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Server database configuration error.'})}

        
        candidate_details = {}
        # Fetch all candidates
        scan_response_candidates = candidates_table_handle.scan()
        all_candidates = scan_response_candidates.get('Items', [])
        while 'LastEvaluatedKey' in scan_response_candidates:
             response_cand_page = candidates_table.scan(ExclusiveStartKey=scan_response_candidates['LastEvaluatedKey'])
             all_candidates.extend(response_cand_page.get('Items', []))
             scan_response_candidates = response_cand_page
        for cand in all_candidates:
             if 'candidate_id' in cand and 'role' in cand:
                candidate_details[cand['candidate_id']] = {
                    'name': cand.get('name', cand.get('candidate_id', 'N/A')),
                    'party': cand.get('party', 'N/A'),
                    'role': cand['role']
                }
             else:
                logger.warning(f"Skipping candidate entry due to missing essential keys (id or role): {cand}")

        logger.info(f"Fetched details for {len(candidate_details)} candidates.")

        
        vote_counts = defaultdict(lambda: defaultdict(int))
        # Fetch all votes
        scan_response_votes = votes_table_handle.scan(ProjectionExpression="candidate_id, role_voted_for")
        all_votes = scan_response_votes.get('Items', [])
        while 'LastEvaluatedKey' in scan_response_votes:
             response_vote_page = votes_table.scan(ProjectionExpression="candidate_id, role_voted_for", ExclusiveStartKey=scan_response_votes['LastEvaluatedKey'])
             all_votes.extend(response_vote_page.get('Items', []))
             scan_response_votes = response_vote_page
        logger.info(f"Processing {len(all_votes)} vote records.")
        
        # Aggregate votes by candidate and role
        for vote in all_votes:
            role_voted = vote.get('role_voted_for') 
            cand_id = vote.get('candidate_id')
            if role_voted and cand_id:
                vote_counts[role_voted][cand_id] += 1
            else:
                logger.warning(f"Skipping vote entry due to missing essential keys (candidate_id or role_voted_for): {vote}")

        
        results = {}
        all_roles_in_candidates = set(cd['role'] for cd in candidate_details.values() if cd.get('role') != 'Unknown')
        
        # Build results for each role
        for role in all_roles_in_candidates:
            results[role] = []
            candidates_for_this_role_ids = [cid for cid, details in candidate_details.items() if details.get('role') == role]

            for cand_id in candidates_for_this_role_ids:
                details = candidate_details.get(cand_id, {})
                count = vote_counts.get(role, {}).get(cand_id, 0)
                
                results[role].append({
                    'candidate_id': cand_id, 'name': details.get('name', cand_id),
                    'party': details.get('party', 'N/A'), 'role': details.get('role', role),
                    'vote_count': count
                })
            # Sort by vote count (descending)
            results[role].sort(key=lambda x: x['vote_count'], reverse=True)
        
        # Ensure both roles are present
        if "President" not in results and "President" in all_roles_in_candidates: results["President"] = []
        if "Secretary" not in results and "Secretary" in all_roles_in_candidates: results["Secretary"] = []

        logger.info("Successfully aggregated voting results.")
        return {
            'statusCode': 200,
            'headers': { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET' 
            },
            'body': json.dumps(results, cls=DecimalEncoder)
        }

    except ClientError as ce:
        logger.error(f"DynamoDB ClientError in getVotingResults: {ce.response['Error']['Message']}", exc_info=True)
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f"Database access error: {ce.response['Error']['Message']}"})}
    except Exception as e:
        logger.error(f"Error getting voting results (after auth): {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': f'Internal server error while fetching results: {str(e)}'})
        }
