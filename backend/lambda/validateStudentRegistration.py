#validatestudentregistration

import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')

ELIGIBILITY_TABLE_NAME = os.environ.get('ELIGIBILITY_TABLE_NAME', 'Attendance')
try:
    eligibility_table = dynamodb.Table(ELIGIBILITY_TABLE_NAME)
except Exception as e:
    print(f"Error initializing DynamoDB table {ELIGIBILITY_TABLE_NAME} in PreSignUp: {e}")
    eligibility_table = None


def lambda_handler(event, context):
    print(f"PreSignUp event: {json.dumps(event)}")

    if not eligibility_table:
        print("Eligibility table not initialized in PreSignUp. Denying registration.")
        
        raise Exception("Internal configuration error. Please try again later.")

    
    user_attributes = event['request']['userAttributes']
    incoming_email = user_attributes.get('email', '').strip().lower() 
    incoming_student_id = user_attributes.get('custom:student_id', '').strip()

    if not incoming_email or not incoming_student_id:
        print("Email or custom:student_id missing in user attributes.")
        raise Exception("Please provide both Email and Student ID.") 

    try:
        response = eligibility_table.get_item(
            Key={'student_id': incoming_student_id}
        )

        if 'Item' in response:
            item = response['Item']
            csv_email = item.get('email', '').strip().lower()

            if csv_email == incoming_email:
                print(f"Validation successful for student_id: {incoming_student_id} and email: {incoming_email}")
                
                return event
            else:
                print(f"Email mismatch for student_id: {incoming_student_id}. Expected: {csv_email}, Got: {incoming_email}")
                raise Exception("The Email address does not match the registered Student ID. Please check your details.")
        else:
            print(f"Student ID {incoming_student_id} not found in the eligibility list.")
            raise Exception("This Student ID is not registered for voting. Please contact administrator.")

    except Exception as e:
        print(f"Error during PreSignUp validation: {str(e)}")
        
        
        raise Exception(str(e)) 