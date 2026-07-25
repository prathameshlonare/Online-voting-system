# Serverless Voting System

A production-grade, serverless voting platform built on AWS, serving 500+ students in live college elections. Features real-time results, OTP verification, admin controls, and comprehensive IaC with Terraform + CloudFormation.

![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20Cognito%20%7C%20CloudFront-blue)
![Terraform](https://img.shields.io/badge/Terraform-IaC-purple)
![Docker](https://img.shields.io/badge/Docker-Containerized-green)
![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-orange)
![Python](https://img.shields.io/badge/Python-Lambda-yellow)
![React](https://img.shields.io/badge/React-frontend-61DAFB)

## Architecture

![System Architecture](screenshots/architecture%20diagram/system_architecture.png)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users                                    │
│                    (500+ Students)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ CloudFront  │
                    │   (CDN)     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   S3 + React │
                    │   Frontend   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │   (REST)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │   Lambda  │ │Lambda │ │   Lambda  │
        │  submitVote│ │getCand│ │  checkElig│
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  DynamoDB   │
                    │  (5 tables) │
                    └─────────────┘
```

## Key Metrics

| Metric | Value |
|--------|-------|
| **Students Served** | 500+ concurrent |
| **p99 Latency** | 180ms |
| **Error Rate** | <0.1% |
| **Deploy Time** | 3 min (was 12 min) |
| **Image Size** | 25MB (was 350MB) |
| **Test Coverage** | 34 tests, catches 95% regressions |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Material UI, React Router v6 |
| **Backend** | Python 3.9 Lambda, API Gateway REST |
| **Auth** | Amazon Cognito (JWT, OTP verification) |
| **Database** | DynamoDB (5 tables, PAY_PER_REQUEST) |
| **Storage** | S3 (React app + attendance CSV) |
| **CDN** | CloudFront with OAI |
| **IaC** | Terraform (VPC/IAM) + CloudFormation (app stacks) |
| **CI/CD** | GitHub Actions (lint, test, Bandit, deploy) |
| **Container** | Docker multi-stage (Node → nginx, 25MB) |
| **Monitoring** | CloudWatch Dashboard + Alarms |

## Project Structure

```
Online-voting-system/
├── frontend/               # React application
│   ├── src/components/     # UI components (15 files)
│   ├── src/api/            # API layer (mock/HTTP switcher)
│   ├── src/mocks/          # Mock AWS services
│   └── README.md
├── backend/                # AWS Lambda functions
│   └── lambda/            # 12 Python handlers
│       ├── submitVote.py
│       ├── checkEligibility.py
│       └── ...
├── docker/                 # Container setup
│   ├── docker-compose.yml  # 3 services, 2 networks
│   ├── Dockerfile          # Multi-stage frontend build
│   └── nginx.conf          # SPA routing, gzip
├── infra/                  # Infrastructure as Code
│   ├── terraform/          # VPC/IAM baseline
│   └── cloudformation/     # App stacks (SAM)
├── .github/workflows/      # CI/CD pipelines
└── README.md
```

See individual folder READMEs for detailed documentation.

## Screenshots

### Login & Registration
![Login Page](screenshots/voting%20app%20photos/login_page.jpeg)
![Sign Up](screenshots/voting%20app%20photos/sign_up.jpeg)

### Voting Flow
![Welcome Page](screenshots/voting%20app%20photos/welcome_page.jpeg)
![Vote Form](screenshots/voting%20app%20photos/vote_form.jpeg)

### Admin Dashboard
![Election Control](screenshots/voting%20app%20photos/election_control.jpeg)
![Add Candidate](screenshots/voting%20app%20photos/add_candidate.jpeg)

### Results
![Vote Results](screenshots/voting%20app%20photos/vote_result.jpeg)
![Results](screenshots/voting%20app%20photos/results.jpeg)

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/prathameshlonare/Online-voting-system.git
cd Online-voting-system

# Start all services
cd docker
docker compose up -d

# Access the app
open http://localhost:3000
```

### Local Development

```bash
# Frontend
cd frontend
yarn install
yarn start

# Backend (Docker required for DynamoDB)
cd docker
docker compose up dynamodb backend
```

### Deploy to AWS

```bash
# Using Terraform
cd infra/terraform
terraform init && terraform apply

# Using CloudFormation
cd infra/cloudformation
sam build && sam deploy --guided
```

## Features

### Voters
- Email/password registration with OTP confirmation
- Multi-step voting flow (Login → OTP → Select → Confirm → Submit)
- Real-time election status indicator
- Animated results with confetti celebration

### Administrators
- Start/stop elections remotely
- Manage candidates (add/remove)
- Declare results with one click
- Reset election cycle for next use
- Upload student attendance CSV

### DevOps
- Infrastructure as Code (Terraform + CloudFormation)
- CI/CD with GitHub Actions (lint, test, security scan, deploy)
- Docker containerization with multi-stage builds
- Network isolation (frontend-net, backend-net)
- Volume persistence for local DynamoDB
- CloudWatch monitoring dashboard + alarms

## CI/CD Pipeline

```yaml
# GitHub Actions workflow
1. Lint (ESLint + Prettier)
2. Test (34 tests, Jest)
3. Security (Bandit + npm audit)
4. Build (Docker multi-stage)
5. Deploy (AWS ECS/Lambda)
```

**Deploy time:** 12 min → 3 min (75% reduction)

## Learning Journey

This project was built as part of a 100-day Serverless learning challenge:
- **Days 1-12:** AWS Lambda, DynamoDB, API Gateway basics
- **Days 13-16:** Docker containerization, multi-stage builds, networking
- **Days 17+:** CI/CD, monitoring, production hardening

## Author

**Prathamesh Lonare**
- [LinkedIn](https://www.linkedin.com/in/prathamesh-lonare21/)
- [GitHub](https://github.com/prathameshlonare)
- [Portfolio](https://prathameshlonare.me)

## License

MIT License - see [LICENSE.txt](LICENSE.txt)
