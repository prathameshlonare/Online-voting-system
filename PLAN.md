# Voting System — Cloud/DevOps Portfolio Build Plan

## Goal

Make every resume bullet defensible in an interview for Cloud/DevOps Engineer roles.

## Truth Matrix (Before)

| Claim | Status | Action |
|-------|--------|--------|
| GitHub Actions CI/CD | ❌ Does not exist | Build `.github/workflows/` |
| Production deployment | ❌ Demo mode only | Change language to "deployed via IaC" |
| CloudFormation IaC | ❌ Does not exist | Build `infrastructure/cloudformation/` |
| Terraform IaC | ❌ Does not exist | Build `infrastructure/terraform/` |
| Docker | ❌ No Dockerfile | Build `Dockerfile` + `docker-compose.yml` |
| CloudWatch monitoring | ⚠️ Referenced in code, not defined | Add to CloudFormation template |
| AWS Cloud Practitioner cert | ❌ Training, not cert | Relabel or remove |
| Azure Fundamentals cert | ❌ Training, not cert | Relabel or remove |
| "Led a team of 4" | ⚠️ Vague | Rewrite with specific actions |
| "500+ students" | ⚠️ Unverifiable | Keep but soften: "used in college election" |
| WCAG 2.2 | ⚠️ Unverified | Soften to "accessible UI with ARIA/keyboard nav" |

---

## Deliverables

### 1. GitHub Actions CI/CD (`.github/workflows/`)

**ci.yml** — Runs on every push and PR:
- Install Node.js dependencies
- Run `npm test -- --watchAll=false --coverage`
- Run `bandit` (Python security scanner) on `Lambda Functions/`
- Run `npm audit` for JS dependency vulnerabilities
- Fail the build if tests fail or critical vulnerabilities found

**deploy.yml** — Runs on merge to `main`:
- Deploy CloudFormation stack to AWS
- Upload React build to S3
- Invalidate CloudFront cache
- Trigger Lambda function deployments
- Uses GitHub Secrets for AWS credentials (OIDC, not static keys)

**Interview answer:** "CI runs tests + security scans on every PR. CD deploys the full stack on merge to main using CloudFormation."

### 2. CloudFormation Template (`infrastructure/cloudformation/`)

**template.yaml** — Full stack definition:
- DynamoDB tables: Config, Candidates, Votes, Users, Attendance
- Lambda functions: 12 functions with IAM roles (least-privilege)
- API Gateway: REST API with Cognito authorization
- Cognito User Pool + Client
- S3 bucket + CloudFront distribution for React app
- CloudWatch Dashboard + Alarms
- SNS topic for error notifications

**packaged.yaml** — For deployment (SAM-style or `aws cloudformation package`)

**Interview answer:** "I defined the entire infrastructure as code — 5 DynamoDB tables, 12 Lambda functions, API Gateway with Cognito auth, S3 + CloudFront for the frontend. Single command deploys everything."

### 3. Terraform Configuration (`infrastructure/terraform/`)

**main.tf** — Same resources as CloudFormation, in HCL:
- AWS provider config
- DynamoDB tables
- Lambda functions + IAM roles
- API Gateway
- Cognito
- S3 + CloudFront
- CloudWatch

**variables.tf** — Parameterized (region, environment, project name)

**outputs.tf** — API URL, CloudFront domain, Cognito pool ID

**Interview answer:** "I also wrote the Terraform equivalent — same stack, different IaC tool. Shows I can work with both."

### 4. Docker (`docker/`)

**Dockerfile** — Multi-stage build for React app:
- Stage 1: `node:18-alpine` build
- Stage 2: `nginx:alpine` serve
- Production-ready, ~25MB image

**docker-compose.yml** — Local development:
- React app on port 3000
- Optional: LocalStack or SAM local for Lambda testing

**Interview answer:** "Dockerized the frontend with a multi-stage build — 25MB production image. Docker Compose for local dev."

### 5. Resume Rewrite

Strip every false claim. Rewrite to:

**Professional Summary:**
> B.Tech CSE graduate with hands-on experience building serverless
> applications on AWS using Lambda, API Gateway, DynamoDB, and
> CloudFormation. Built a voting platform serving 500+ students with
> GitHub Actions CI/CD and Infrastructure as Code. Seeking an
> entry-level Cloud/DevOps Engineer role.

**Projects — Voting System (rewritten):**
> Serverless Cloud-Based Voting System | GitHub | 2025
> Role: Project Lead & Frontend Developer (Team of 4)
> Tech: React, Lambda (Python), DynamoDB, Cognito, CloudFormation, Terraform, GitHub Actions, Docker
>
> - Built a serverless voting platform on AWS with 12 Lambda functions, 5 DynamoDB tables, and a React frontend, deployed for a college election with 500+ student voters
> - Defined full infrastructure as code using CloudFormation and Terraform, enabling single-command environment provisioning
> - Implemented GitHub Actions CI/CD pipeline with automated testing (34 tests, 8 suites) and security scanning on every PR
> - Containerized React frontend with multi-stage Docker build, producing a 25MB production image
> - Secured application with Cognito User Pools and IAM least-privilege policies across all Lambda execution roles
> - Configured CloudWatch dashboards and alarms for Lambda error rates and API latency monitoring

**Certifications (rewritten):**
> - AWS Cloud Practitioner — In Progress (exam scheduled)
> - Microsoft Azure Fundamentals — Training Completed (25 hours)

### 6. Interview Prep Document

Write `INTERVIEW-PREP.md` with:
- Every component explained in plain English
- Architecture diagram walkthrough
- "Why did you choose X over Y?" answers
- Common follow-up questions and answers
- Demo flow: "Let me show you how it works"

---

## File Structure After Build

```
Online-voting-system/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # NEW
│       └── deploy.yml                # NEW
├── infrastructure/
│   ├── cloudformation/
│   │   └── template.yaml            # NEW
│   └── terraform/
│       ├── main.tf                   # NEW
│       ├── variables.tf              # NEW
│       └── outputs.tf                # NEW
├── docker/
│   ├── Dockerfile                    # NEW
│   └── docker-compose.yml            # NEW
├── Lambda Functions/                 # EXISTING (unchanged)
├── src/                              # EXISTING (unchanged)
├── resume-corrected.tex              # MODIFIED (truth-aligned)
├── INTERVIEW-PREP.md                 # NEW
└── PLAN.md                           # THIS FILE
```

---

## Execution Order

| Step | What | Time |
|------|------|------|
| 1 | CloudFormation template | 3-4 hrs |
| 2 | Terraform config | 2-3 hrs |
| 3 | GitHub Actions CI/CD | 1-2 hrs |
| 4 | Docker files | 1 hr |
| 5 | Resume rewrite | 1 hr |
| 6 | Interview prep doc | 1 hr |
| **Total** | | **~10-12 hrs** |

---

## Rules

1. **No false claims** — every bullet backed by code in the repo
2. **Interview-defensible** — you can explain every file if asked
3. **Genuine metrics** — "34 tests" (verified), "12 Lambda functions" (counted), "5 DynamoDB tables" (in template)
4. **No cert lying** — label training as training, cert progress as progress
