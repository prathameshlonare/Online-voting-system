################################################################################
# Lambda Function: getCandidate
# Description: Retrieves all election candidates from database
# Trigger: API Gateway GET /candidates
# Auth Required: No (Public endpoint)
# Table: DynamoDB - Candidates
################################################################################
#getcandidate
import json
import boto3
import os
from decimal import Decimal 
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
CANDIDATES_TABLE_NAME = os.environ.get('CANDIDATES_TABLE_NAME', 'Candidates') 

try:
    candidates_table = dynamodb.Table(CANDIDATES_TABLE_NAME)
except Exception as e:
    logger.error(f"Error initializing DynamoDB table handle for Candidates: {e}")
    candidates_table = None


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle DynamoDB Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0: 
                return int(obj)
            else: 
                return float(obj)
        return json.JSONEncoder.default(self, obj)

def lambda_handler(event, context):
    """
    Main Lambda handler - Returns all candidates
    No authentication required
    """
    logger.info(f"Received event for getCandidates: {json.dumps(event)}")

    if not candidates_table:
        logger.error("Candidates table not initialized.")
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' }, 
            'body': json.dumps({'error': 'Internal server error: Table configuration issue.'})
        }

    try:
        # Scan all candidates from table
        response = candidates_table.scan() 
        items = response.get('Items', [])
        
        # Handle pagination for large datasets
        while 'LastEvaluatedKey' in response:
            logger.info("Paginating to get more candidates...")
            response = candidates_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))

        logger.info(f"Successfully fetched {len(items)} candidates.")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps(items, cls=DecimalEncoder)
        }

    except Exception as e:
        logger.error(f"Error fetching candidates: {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }
