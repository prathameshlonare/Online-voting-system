################################################################################
# Lambda Function: uploadStudentMaster
# Description: Uploads student master data from CSV (student info + attendance)
# Trigger: API Gateway POST /upload
# Auth Required: Admin Only
# Tables: DynamoDB - Users, Attendance
# CSV Format: student_id, email, name, attendancePercentage
################################################################################

import json
import boto3
import base64
import csv
import io
import os
import logging
from decimal import Decimal 

logger = logging.getLogger()
logger.setLevel(logging.INFO)

USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME', 'Users') 
ATTENDANCE_TABLE_NAME = os.environ.get('ATTENDANCE_TABLE_NAME', 'Attendance') 

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(USERS_TABLE_NAME)
attendance_table = dynamodb.Table(ATTENDANCE_TABLE_NAME)

def lambda_handler(event, context):
    """
    Main Lambda handler - Processes student master CSV upload
    Expected: Base64 encoded CSV in request body
    CSV Columns: student_id, email, name, attendancePercentage
    """
    logger.info(f"Received event: {json.dumps(event)}")

    filename = event.get('queryStringParameters', {}).get('filename', 'unknown_combined_file.csv')
    logger.info(f"Processing combined file: {filename}")

    if not event.get('isBase64Encoded'):
        logger.error("Request body is not Base64 encoded.")
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' }, 
            'body': json.dumps({'error': 'Request body must be Base64 encoded.'})
        }

    try:
        csv_content_bytes = base64.b64decode(event['body'])
        csv_content_string = csv_content_bytes.decode('utf-8')
        logger.info(f"Successfully decoded Base64 body for file: {filename}")
    except Exception as e:
        logger.error(f"Error decoding Base64 body: {e}")
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': f'Failed to decode Base64 body: {e}'})
        }

    processed_count = 0
    error_count = 0
    error_details = []

    try:
        csvfile = io.StringIO(csv_content_string)
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            try:
                student_id = row.get('student_id', '').strip()
                email = row.get('email', '').strip()
                name = row.get('name', '').strip()
                attendance_percentage_str = row.get('attendancePercentage', '').strip() 

                if not student_id or not email or not name or not attendance_percentage_str:
                    logger.warning(f"Skipping row due to missing data: {row}")
                    error_count += 1
                    error_details.append(f"Missing data in row: {row}")
                    continue 

                if '@' not in email or '.' not in email.split('@')[-1]:
                     logger.warning(f"Skipping row due to invalid email format: {row}")
                     error_count += 1
                     error_details.append(f"Invalid email format in row: {row}")
                     continue 

                try:
                    attendance_percentage = Decimal(attendance_percentage_str)
                except ValueError:
                    logger.warning(f"Skipping row due to invalid attendance percentage: {row}")
                    error_count += 1
                    error_details.append(f"Invalid attendance percentage in row: {row}")
                    continue 

                user_item = {
                    'student_id': student_id,
                    'email': email,
                    'name': name
                }
                users_table.put_item(Item=user_item)

                attendance_item = {
                    'student_id': student_id,
                    'attendancePercentage': attendance_percentage 
                }
                attendance_table.put_item(Item=attendance_item)

                processed_count += 1

            except Exception as row_error:
                logger.error(f"Error processing row {row}: {row_error}")
                error_count += 1
                error_details.append(f"Error processing row {row}: {row_error}")
                
        logger.info(f"Combined CSV processing complete. Processed: {processed_count}, Errors: {error_count}")

    except Exception as e:
        logger.error(f"Error parsing combined CSV file {filename}: {e}")
        return {
            'statusCode': 400,
             'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': f'Failed to parse CSV file: {e}'})
        }

    response_body = {
        'message': f'Successfully processed combined file {filename}. Records processed: {processed_count}. Errors encountered: {error_count}.',
        'errors': error_details[:10] 
    }

    return {
        'statusCode': 200 if error_count == 0 else 207, 
         'headers': {
             'Access-Control-Allow-Origin': '*', 
             'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
             'Access-Control-Allow-Methods': 'OPTIONS,POST' 
         },
        'body': json.dumps(response_body)
    }
