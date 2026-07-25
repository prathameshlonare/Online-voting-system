# Backend — AWS Lambda Functions

Serverless backend comprising 12 Python Lambda functions handling vote submission, eligibility checks, election management, and result aggregation via API Gateway and DynamoDB.

## Architecture

```
backend/
└── lambda/
    ├── submitVote.py              # Submit student votes (POST /vote)
    ├── checkEligibility.py        # Verify voter eligibility (GET /eligibility)
    ├── getElectionStatus.py       # Get election state (GET /election/status)
    ├── getCandidate.py            # List candidates (GET /candidates)
    ├── getVotingResults.py        # Aggregate vote counts (GET /results)
    ├── startElection.py           # Admin: start election (POST /election/start)
    ├── stopElection.py            # Admin: stop election (POST /election/stop)
    ├── declearResult.py           # Admin: declare winner (POST /election/declare)
    ├── resetElectionCycle.py      # Admin: reset for new cycle (POST /election/reset)
    ├── addCandidate.py            # Admin: add candidate (POST /candidates)
    ├── uploadStudentMaster.py     # Admin: upload student list (CSV to S3)
    └── validateStudentRegistration.py  # Register new students
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/election/status` | Optional | Returns election state (NOT_STARTED/RUNNING/STOPPED/RESULTS_DECLARED) |
| `GET` | `/candidates` | Yes | Lists all candidates with vote counts |
| `GET` | `/results` | Yes | Returns aggregated voting results |
| `GET` | `/eligibility?student_id=X` | Yes | Checks if student can vote (attendance threshold) |
| `POST` | `/vote` | Yes | Submits votes for President and Secretary |
| `POST` | `/candidates` | Admin | Adds a new candidate |
| `POST` | `/election/start` | Admin | Sets election status to RUNNING |
| `POST` | `/election/stop` | Admin | Sets election status to STOPPED |
| `POST` | `/election/declare` | Admin | Declares results and sets status to RESULTS_DECLARED |
| `POST` | `/election/reset` | Admin | Resets election for new cycle |

## DynamoDB Tables

| Table | Purpose | Partition Key |
|-------|---------|---------------|
| `Config` | Election settings, status, thresholds | `config_key` |
| `Votes` | Student vote records | `student_id` + `role_voted_for` |
| `Candidates` | Candidate profiles | `candidate_id` |
| `Students` | Student registration data | `student_id` |

## Authentication Flow

1. **JWT Validation** — All authenticated endpoints validate Cognito JWT tokens
2. **Admin Check** — Admin endpoints verify user belongs to `admin` Cognito group
3. **Token Claims** — Extracts `custom:student_id` from validated token
4. **Key Rotation** — Fetches Cognito public keys from `.well-known/jwks.json`

## Environment Variables

```bash
COGNITO_USER_POOL_ID    # Cognito User Pool ID
COGNITO_APP_CLIENT_ID   # Cognito App Client ID
AWS_REGION              # AWS region (default: us-east-1)
CONFIG_TABLE_NAME       # DynamoDB Config table name
VOTES_TABLE_NAME        # DynamoDB Votes table name
CANDIDATES_TABLE_NAME   # DynamoDB Candidates table name
S3_BUCKET_NAME          # S3 bucket for attendance CSV
S3_ATTENDANCE_FILE_KEY  # S3 key for attendance file
```

## Local Development

For local testing without AWS, use the Docker mock backend:

```bash
cd ../docker
docker compose up backend
# Mock backend runs on http://localhost:4000
```

The mock backend (`docker/server.js`) uses in-memory data to simulate Lambda behavior.

## Deployment

### AWS (Production)

```bash
# Using CloudFormation
cd ../infra/cloudformation
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name voting-system \
  --capabilities CAPABILITY_NAMED_IAM

# Using Terraform
cd ../infra/terraform
terraform init
terraform apply
```

### Docker (Local)

```bash
cd ../docker
docker compose up -d
```

## Performance

- **p99 Latency:** 180ms under 500+ concurrent voters
- **Error Rate:** <0.1% in production
- **Vote Submission:** DynamoDB batch writes for atomic multi-role voting
- **Eligibility Check:** S3 CSV parsing with attendance threshold validation
