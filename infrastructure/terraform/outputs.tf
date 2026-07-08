output "api_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "react_app_bucket" {
  description = "S3 bucket for React app"
  value       = aws_s3_bucket.react_app.id
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${local.project}-dashboard"
}

output "dynamo_tables" {
  description = "DynamoDB table names"
  value = {
    config     = aws_dynamodb_table.config.name
    candidates = aws_dynamodb_table.candidates.name
    votes      = aws_dynamodb_table.votes.name
    users      = aws_dynamodb_table.users.name
    attendance = aws_dynamodb_table.attendance.name
  }
}
