terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  project = var.project_name
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─────────────────────────────────────────────
# DynamoDB Tables
# ─────────────────────────────────────────────

resource "aws_dynamodb_table" "config" {
  name         = "${local.project}-config"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "config_key"

  attribute {
    name = "config_key"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "candidates" {
  name         = "${local.project}-candidates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "candidate_id"

  attribute {
    name = "candidate_id"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "votes" {
  name         = "${local.project}-votes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "student_id"
  range_key    = "role_voted_for"

  attribute {
    name = "student_id"
    type = "S"
  }

  attribute {
    name = "role_voted_for"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "users" {
  name         = "${local.project}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "student_id"

  attribute {
    name = "student_id"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "attendance" {
  name         = "${local.project}-attendance"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "student_id"

  attribute {
    name = "student_id"
    type = "S"
  }

  tags = local.common_tags
}

# ─────────────────────────────────────────────
# Cognito User Pool + Client
# ─────────────────────────────────────────────

resource "aws_cognito_user_pool" "main" {
  name = "${local.project}-user-pool"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = false
    developer_only_attribute = false
  }

  schema {
    name                     = "custom:student_id"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = false
    developer_only_attribute = false
  }

  schema {
    name                     = "custom:mobile_number"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false
  }

  lambda_config {
    pre_sign_up = aws_lambda_function.validate_student_registration.arn
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.project}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}

# ─────────────────────────────────────────────
# S3 Buckets
# ─────────────────────────────────────────────

resource "aws_s3_bucket" "react_app" {
  bucket = "${local.project}-react-app"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "react_app" {
  bucket = aws_s3_bucket.react_app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "attendance" {
  bucket = "${local.project}-attendance"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "attendance" {
  bucket = aws_s3_bucket.attendance.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────
# CloudFront
# ─────────────────────────────────────────────

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${local.project} React app"
}

resource "aws_s3_bucket_policy" "react_app" {
  bucket = aws_s3_bucket.react_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.react_app.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.react_app.bucket_regional_domain_name
    origin_id   = "S3ReactApp"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3ReactApp"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

# ─────────────────────────────────────────────
# IAM Role
# ─────────────────────────────────────────────

resource "aws_iam_role" "lambda_execution" {
  name = "${local.project}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.project}-dynamodb-access"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.config.arn,
          aws_dynamodb_table.candidates.arn,
          aws_dynamodb_table.votes.arn,
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.attendance.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "${local.project}-s3-read"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.attendance.arn}/*"
      }
    ]
  })
}

# ─────────────────────────────────────────────
# Lambda Functions
# ─────────────────────────────────────────────

variable "lambda_functions" {
  default = [
    "addCandidate",
    "checkEligibility",
    "declareResult",
    "getCandidate",
    "getElectionStatus",
    "getVotingResults",
    "resetElectionCycle",
    "startElection",
    "stopElection",
    "submitVote",
    "uploadStudentMaster",
    "validateStudentRegistration"
  ]
}

resource "aws_lambda_function" "functions" {
  for_each = toset(var.lambda_functions)

  function_name = "${local.project}-${each.key}"
  runtime       = "python3.9"
  handler       = "index.lambda_handler"
  role          = aws_iam_role.lambda_execution.arn
  timeout       = each.key == "uploadStudentMaster" ? 60 : 30
  memory_size   = each.key == "uploadStudentMaster" ? 256 : 128

  filename         = "${path.module}/lambda-placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda-placeholder.zip")

  environment {
    variables = merge(
      {
        CONFIG_TABLE_NAME     = aws_dynamodb_table.config.name
        CANDIDATES_TABLE_NAME = aws_dynamodb_table.candidates.name
        VOTES_TABLE_NAME      = aws_dynamodb_table.votes.name
        USERS_TABLE_NAME      = aws_dynamodb_table.users.name
        ATTENDANCE_TABLE_NAME = aws_dynamodb_table.attendance.name
        ELIGIBILITY_TABLE_NAME = aws_dynamodb_table.attendance.name
        S3_BUCKET_NAME        = aws_s3_bucket.attendance.id
        S3_ATTENDANCE_FILE_KEY = "attendance.csv"
        COGNITO_USER_POOL_ID  = aws_cognito_user_pool.main.id
        COGNITO_APP_CLIENT_ID = aws_cognito_user_pool_client.main.id
        COGNITO_REGION        = var.aws_region
        AWS_REGION            = var.aws_region
      },
      # Only include relevant env vars per function (simplified here — all get all)
      {}
    )
  }

  tags = local.common_tags
}

# ─────────────────────────────────────────────
# API Gateway
# ─────────────────────────────────────────────

resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.project}-api"
  description = "RCERT Voting System REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "CognitoAuthorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.main.arn]
}

# --- Public: getCandidate ---
resource "aws_api_gateway_resource" "get_candidate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "getCandidate"
}

resource "aws_api_gateway_method" "get_candidate" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.get_candidate.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_candidate" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.get_candidate.id
  http_method             = aws_api_gateway_method.get_candidate.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions["getCandidate"].invoke_arn
}

# --- Authenticated routes ---
resource "aws_api_gateway_resource" "submit_vote" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "submitVote"
}

resource "aws_api_gateway_method" "submit_vote" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.submit_vote.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "submit_vote" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.submit_vote.id
  http_method             = aws_api_gateway_method.submit_vote.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions["submitVote"].invoke_arn
}

resource "aws_api_gateway_resource" "check_eligibility" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "checkEligibility"
}

resource "aws_api_gateway_method" "check_eligibility" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.check_eligibility.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "check_eligibility" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.check_eligibility.id
  http_method             = aws_api_gateway_method.check_eligibility.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions["checkEligibility"].invoke_arn
}

# Admin routes
resource "aws_api_gateway_resource" "add_candidate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "addCandidate"
}

resource "aws_api_gateway_method" "add_candidate" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.add_candidate.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "add_candidate" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.add_candidate.id
  http_method             = aws_api_gateway_method.add_candidate.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions["addCandidate"].invoke_arn
}

# API Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  depends_on = [
    aws_api_gateway_integration.get_candidate,
    aws_api_gateway_integration.submit_vote,
    aws_api_gateway_integration.check_eligibility,
    aws_api_gateway_integration.add_candidate
  ]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"
}

# Lambda permissions
resource "aws_lambda_permission" "api_gateway" {
  for_each = toset(var.lambda_functions)

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Cognito PreSignUp permission
resource "aws_lambda_permission" "cognito_presignup" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions["validateStudentRegistration"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# ─────────────────────────────────────────────
# CloudWatch Dashboard + Alarms
# ─────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.project}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Lambda Invocations & Errors"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${local.project}-submitVote"],
            ["AWS/Lambda", "Errors", "FunctionName", "${local.project}-submitVote"],
            ["AWS/Lambda", "Invocations", "FunctionName", "${local.project}-getCandidate"],
            ["AWS/Lambda", "Errors", "FunctionName", "${local.project}-getCandidate"]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway Latency"
          region = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", "${local.project}-api"],
            ["AWS/ApiGateway", "5XXError", "ApiName", "${local.project}-api"]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "DynamoDB Read/Write"
          region = var.aws_region
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${local.project}-votes"],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${local.project}-votes"]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Lambda Duration"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "${local.project}-submitVote"],
            ["AWS/Lambda", "Duration", "FunctionName", "${local.project}-checkEligibility"]
          ]
          period = 300
          stat   = "Average"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.project}-lambda-errors"
  alarm_description   = "Alert when Lambda error rate exceeds threshold"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    FunctionName = "${local.project}-submitVote"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.project}-api-5xx"
  alarm_description   = "Alert when API Gateway returns 5xx errors"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 3
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    ApiName = "${local.project}-api"
  }

  tags = local.common_tags
}
