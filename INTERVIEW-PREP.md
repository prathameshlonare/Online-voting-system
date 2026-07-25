# Interview Prep — RCERT Voting System

Every question they might ask, with answers backed by code in the repo.

---

## Architecture Overview

```
React App (S3 + CloudFront)
    ↓ HTTPS
API Gateway (REST, Cognito auth)
    ↓ Lambda Proxy Integration
Lambda Functions (Python 3.9)
    ↓ boto3
DynamoDB (5 tables, on-demand capacity)
```

**If they ask "walk me through the architecture":**
"React frontend is served from S3 via CloudFront. Users authenticate through Cognito, which issues JWT tokens. API Gateway validates the JWT and routes requests to 12 Lambda functions. Each function connects to DynamoDB using boto3. I defined the entire stack in both CloudFormation and Terraform."

---

## DynamoDB Design

| Table | Partition Key | Sort Key | Purpose |
|-------|--------------|----------|---------|
| Config | `config_key` (String) | — | Election status, settings |
| Candidates | `candidate_id` (String) | — | Candidate info |
| Votes | `student_id` (String) | `role_voted_for` (String) | One vote per student per role |
| Users | `student_id` (String) | — | Student records |
| Attendance | `student_id` (String) | — | Eligibility data |

**If they ask "why DynamoDB over RDS":**
"Voting is read-heavy during election (everyone checking candidates) and write-heavy during voting (500+ students submitting simultaneously). DynamoDB handles this with on-demand capacity — no need to provision or scale instances. It also integrates natively with Lambda and API Gateway."

**If they ask "why on-demand pricing":**
"College elections are bursty — 500 students vote in a 2-hour window, then the table is idle. On-demand means we pay per request instead of paying for idle capacity."

---

## Lambda Functions

12 functions, all Python 3.9, all follow the same pattern:

```python
def lambda_handler(event, context):
    # 1. Extract JWT from Authorization header
    # 2. Validate JWT against Cognito JWKS endpoint
    # 3. Check claims (admin vs student)
    # 4. Business logic
    # 5. DynamoDB operations
    # 6. Return response with CORS headers
```

**If they ask "how do you handle cold starts":**
"Lambda functions are 128MB with 30s timeout. Cold starts for Python 3.9 are typically under 500ms. For a college election with 500 users over 2 hours, cold starts aren't a bottleneck. For a larger system, I'd use provisioned concurrency."

**If they ask "how do you handle errors":**
"Every function has structured error handling: specific exceptions (ClientError, JWT errors, validation errors) return appropriate HTTP status codes. Unexpected errors return 500 with sanitized messages. CloudWatch logs capture the full stack trace."

---

## Authentication Flow

```
User → Cognito Sign Up → PreSignUp Lambda validates student_id →
Cognito issues JWT → API Gateway validates JWT via Cognito Authorizer →
Lambda receives validated claims in event.request.authorizer
```

**If they ask "how does the PreSignUp trigger work":**
"When a student signs up, Cognito triggers `validateStudentRegistrationLambda` before creating the account. The function reads the student_id from the signup attributes, checks it against the Attendance DynamoDB table, and rejects the signup if the student isn't in the system."

**If they ask "how do you enforce one-vote-per-student":**
"Each vote has a composite key: `student_id` + `role_voted_for`. Before inserting, we check if an item with that key already exists. If it does, we return a 409 Conflict. DynamoDB's conditional writes could also handle this atomically."

---

## CI/CD Pipeline

**`.github/workflows/ci.yml` — runs on every PR:**
1. `npm ci` — install Node.js dependencies
2. `npm test -- --coverage` — run 34 tests
3. `bandit -r "Lambda Functions/"` — Python security scan
4. `npm audit --audit-level=critical` — JS dependency vulnerabilities
5. `npx eslint src/` — lint React code

**`.github/workflows/deploy.yml` — runs on merge to main:**
1. `aws cloudformation deploy` — deploy/update the full stack
2. `npm run build` — build React app
3. `aws s3 sync build/ s3://bucket/` — upload to S3
4. `aws cloudfront create-invalidation` — bust CDN cache

**If they ask "why GitHub Actions over Jenkins":**
"Free for open source, no infrastructure to maintain, native GitHub integration. For a project of this scale, Actions is the right choice. Jenkins would be overkill."

**If they ask "what happens if a test fails":**
"The PR check fails, merge is blocked until tests pass. We can't deploy broken code."

---

## Infrastructure as Code

**CloudFormation (`infrastructure/cloudformation/template.yaml`):**
- 140+ lines defining the full stack
- Parameters for project name, environment, admin email
- Outputs: API URL, CloudFront domain, Cognito pool ID
- Nested resources: DynamoDB, Lambda, API Gateway, Cognito, S3, CloudFront, IAM, CloudWatch

**Terraform (`infrastructure/terraform/`):**
- Same resources in HCL
- `main.tf` — all resources
- `variables.tf` — parameterized (region, project, environment)
- `outputs.tf` — API URL, CloudFront domain, table names

**If they ask "CloudFormation vs Terraform":**
"CloudFormation is AWS-native — tighter integration, no extra tooling. Terraform is cloud-agnostic — same syntax for AWS, Azure, GCP. I built both to demonstrate proficiency with either approach. For a pure-AWS project, CloudFormation is simpler. For multi-cloud, Terraform is the standard."

**If they ask "what is IaC and why does it matter":**
"IaC means defining infrastructure in code instead of clicking through the console. Benefits: version control, peer review, reproducibility, disaster recovery. If my AWS account gets deleted, I can redeploy the entire stack with one command."

---

## Docker

**Multi-stage build (`docker/Dockerfile`):**
```
Stage 1 (node:18-alpine): npm ci → npm run build → production React bundle
Stage 2 (nginx:alpine): copy build output → serve static files
```

**If they ask "why multi-stage":**
"Build stage needs Node.js (200MB+). Production only needs nginx (25MB). Multi-stage keeps the final image small and reduces attack surface."

**If they ask "why nginx over serving from Node":**
"React is a static SPA — no server-side rendering needed. nginx is optimized for serving static files, handles gzip compression, caching headers, and SPA routing (`try_files`). Lower memory footprint than Node.js for this use case."

---

## CloudWatch Monitoring

Dashboard widgets:
1. Lambda invocations + errors (submitVote, getCandidate)
2. API Gateway latency + 5xx errors
3. DynamoDB read/write capacity (votes table)
4. Lambda duration (submitVote, checkEligibility)

Alarms:
- Lambda errors > 5 in 5 minutes → alert
- API 5xx > 3 in 5 minutes → alert

**If they ask "how do you monitor in production":**
"CloudWatch dashboard gives real-time visibility. Alarms trigger SNS notifications when thresholds are breached. For a college election, this was sufficient. For a larger system, I'd add Datadog or Grafana for cross-service tracing."

---

## Common Follow-Up Questions

**"What would you do differently?"**
- Add DynamoDB TTL for vote cleanup after election
- Use DynamoDB condition expressions for atomic one-vote enforcement
- Add WAF to API Gateway for rate limiting
- Use Step Functions for multi-step election workflows
- Add x-ray tracing for distributed debugging

**"What was the hardest part?"**
"JWT validation in Lambda. Each function needs to fetch Cognito's public keys, match the key ID from the token header, and verify the signature. Getting the key refresh logic right was tricky — keys rotate, so you can't cache them indefinitely."

**"How did you handle security?"**
- Cognito User Pools for authentication
- JWT validation on every authenticated endpoint
- IAM least-privilege: each Lambda only accesses the DynamoDB tables it needs
- No hardcoded secrets — all credentials via environment variables
- S3 buckets with public access blocked
- Security scanning in CI (bandit + npm audit)

**"Tell me about the team structure."**
"4 members. I was project lead and managed the entire AWS infrastructure for the voting system — Lambda, DynamoDB, API Gateway, Cognito, CloudFormation, CI/CD. Swapnil handled DevOps and security. Mohak was backend developer. Suyog did UI/UX design and collected requirements for how the actual college election works. I proposed the system to the HOD, coordinated the team, and made the final technical decisions."

**"How did you propose this to the HOD?"**
"Our departmental president elections were coming up. I told the HOD that if the system works, we do digital voting. If it fails, we fall back to chit-based elections. He agreed. We deployed it, and it worked — 500+ students voted digitally."

**"What was your specific contribution to the voting system?"**
"I designed and deployed the full AWS infrastructure — 12 Lambda functions, 5 DynamoDB tables, API Gateway with Cognito auth, S3 + CloudFront for the frontend. I also defined the IaC templates in both CloudFormation and Terraform, set up the GitHub Actions CI/CD pipeline, and containerized the frontend with Docker."

**"What about Dorm & Dish?"**
"I was the primary developer — 100 out of 116 commits are mine. I built the frontend (16 pages, 35+ components), designed all 41 Lambda functions, set up 7 DynamoDB tables, implemented the S3 presigned URL upload flow, and built the Cognito-based RBAC system with role-specific access for students, owners, and admins. I also implemented location-based recommendations using haversine distance calculation."

---

## Demo Flow (if asked to walk through)

1. Show `infrastructure/cloudformation/template.yaml` — "This is the full stack definition"
2. Show `.github/workflows/ci.yml` — "This runs tests on every PR"
3. Show `.github/workflows/deploy.yml` — "This deploys on merge to main"
4. Show `Lambda Functions/submitVote.py` — "This handles vote submission with JWT validation"
5. Show `docker/Dockerfile` — "Multi-stage build, 25MB production image"
6. Show `infrastructure/terraform/main.tf` — "Same stack in Terraform"

---

## Files to Know

| File | What it does | Why it matters |
|------|-------------|----------------|
| `infrastructure/cloudformation/template.yaml` | Full AWS stack | IaC evidence |
| `infrastructure/terraform/main.tf` | Same stack in HCL | Terraform evidence |
| `.github/workflows/ci.yml` | Test + security scanning | CI/CD evidence |
| `.github/workflows/deploy.yml` | Deploy to AWS | CD evidence |
| `docker/Dockerfile` | Multi-stage React build | Docker evidence |
| `Lambda Functions/submitVote.py` | Vote submission with JWT | Security evidence |
| `src/components/` | 15 React components | Frontend evidence |
| `src/*.test.js` | 34 tests | Testing evidence |
