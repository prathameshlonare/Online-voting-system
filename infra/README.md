# Infrastructure as Code

AWS serverless infrastructure defined in both Terraform and CloudFormation, including DynamoDB tables, Lambda functions, API Gateway, Cognito, S3, CloudFront, IAM, and CloudWatch monitoring.

## Architecture

```
infra/
├── terraform/              # Terraform configuration
│   ├── main.tf            # Core infrastructure (676 lines)
│   ├── variables.tf       # Input variables
│   └── outputs.tf         # Output values
└── cloudformation/         # CloudFormation/SAM template
    └── template.yaml      # SAM template (1023 lines)
```

## AWS Resources

### DynamoDB Tables (5)

| Table | Partition Key | Range Key | Purpose |
|-------|---------------|-----------|---------|
| `Config` | `config_key` | — | Election status, thresholds |
| `Candidates` | `candidate_id` | — | Candidate profiles |
| `Votes` | `student_id` | `role_voted_for` | Vote records |
| `Users` | `student_id` | — | Student registration |
| `Attendance` | `student_id` | — | Attendance data |

### Lambda Functions (12)

| Function | Runtime | Timeout | Purpose |
|----------|---------|---------|---------|
| `submitVote` | Python 3.9 | 30s | Process vote submission |
| `checkEligibility` | Python 3.9 | 30s | Verify attendance threshold |
| `getElectionStatus` | Python 3.9 | 30s | Return election state |
| `getCandidate` | Python 3.9 | 30s | List candidates |
| `getVotingResults` | Python 3.9 | 30s | Aggregate vote counts |
| `startElection` | Python 3.9 | 30s | Admin: start election |
| `stopElection` | Python 3.9 | 30s | Admin: stop election |
| `declareResult` | Python 3.9 | 30s | Admin: declare winner |
| `resetElectionCycle` | Python 3.9 | 30s | Admin: reset cycle |
| `addCandidate` | Python 3.9 | 30s | Admin: add candidate |
| `uploadStudentMaster` | Python 3.9 | 60s | Admin: upload CSV |
| `validateStudentRegistration` | Python 3.9 | 30s | Cognito pre-signup |

### API Gateway

| Endpoint | Method | Auth | Lambda |
|----------|--------|------|--------|
| `/getCandidate` | GET | Public | `getCandidate` |
| `/submitVote` | POST | Cognito | `submitVote` |
| `/checkEligibility` | GET | Cognito | `checkEligibility` |
| `/addCandidate` | POST | Cognito | `addCandidate` |

### Other Resources

- **Cognito** — User pool with email auth, custom `student_id` attribute
- **S3** — React app bucket (CloudFront origin), attendance CSV bucket
- **CloudFront** — CDN with OAI for S3, SPA routing (403/404 → index.html)
- **IAM** — Least-privilege Lambda execution role (DynamoDB + S3 read)
- **CloudWatch** — Dashboard (Lambda invocations, API latency, DynamoDB R/W), error alarms

## Deployment

### Terraform

```bash
cd terraform

# Initialize
terraform init

# Plan changes
terraform plan -var="project_name=rcert-voting" -var="environment=prod"

# Apply
terraform apply -var="project_name=rcert-voting" -var="environment=prod"

# Destroy (careful!)
terraform destroy
```

### CloudFormation (SAM)

```bash
cd cloudformation

# Build and deploy
sam build
sam deploy --guided \
  --parameter-overrides \
    ProjectName=rcert-voting \
    Environment=prod \
    CognitoAdminEmail=admin@rcert.edu
```

## Terraform vs CloudFormation

| Aspect | Terraform | CloudFormation |
|--------|-----------|----------------|
| **Lines** | 676 | 1023 |
| **Syntax** | HCL | YAML |
| **State** | Remote backend | Managed by AWS |
| **Approach** | Imperative | Declarative |
| **Use Case** | VPC/IAM baseline | App stacks |

The project uses **both** intentionally — Terraform for foundational infrastructure, CloudFormation for application stacks. This demonstrates proficiency in both IaC tools.

## Monitoring

### CloudWatch Dashboard

Four widgets:
1. **Lambda Invocations & Errors** — submitVote, getCandidate
2. **API Gateway Latency** — Average response time, 5xx errors
3. **DynamoDB Read/Write** — Consumed capacity units
4. **Lambda Duration** — Execution time percentiles

### Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| `lambda-errors` | Lambda Errors | >5 in 10min | SNS notification |
| `api-5xx` | API 5XXError | >3 in 10min | SNS notification |

## Security

- **IAM Least Privilege** — Lambda functions get only required DynamoDB/S3 permissions
- **Cognito JWT Validation** — All authenticated endpoints verify tokens
- **S3 Bucket Policies** — Public access blocked, OAI for CloudFront
- **VPC Isolation** — (Planned) Lambda functions in private subnets
