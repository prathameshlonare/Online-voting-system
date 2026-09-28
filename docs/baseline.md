# Technical Baseline & Architectural Audit

**Project:** Online Voting System  
**Document Created:** 2026-09-29  
**Status:** Baseline Established (Gate 0)  
**Workspace:** `D:\projects\Serverless Voting System`

---

## 1. Purpose of this Document

This document defines the clear technical boundary between:
1. **The original college application**, designed and deployed by the college team for a real departmental election.
2. **The unverified additions**, configuration files added post-college with AI assistance that contain broken paths or unmeasured claims.
3. **The new DevOps engineering layer**, which will be built and verified from scratch to transform this repository into a defensible portfolio project.

By establishing this baseline, all claims on resumes, GitHub, and technical interviews remain completely honest, verifiable, and grounded in working code.

---

## 2. Original College Baseline (Verified Core)

The application was built to replace manual paper ballot voting for departmental student council elections (President, Secretary). Eligibility was validated against an official student attendance register uploaded by the admin.

### System Architecture
```text
[ React 18 Single Page App ]
            │
      (HTTPS / REST)
            ▼
[ Amazon API Gateway ] ── (Cognito User Pool JWT / OTP)
            │
            ▼
[ 12 Python AWS Lambda Functions ]
            │
            ▼
[ Amazon DynamoDB (5 Tables) ]
```

### The 12 Backend Lambda Functions (`backend/lambda/`)
The backend is written in Python (using `boto3`):

| Lambda Function | File Name | Role in Election Lifecycle |
| :--- | :--- | :--- |
| **Upload Master Data** | `uploadStudentMaster.py` | Admin uploads CSV of eligible students and attendance records. |
| **Validate Registration** | `validateStudentRegistration.py` | Validates registration status against attendance records. |
| **Check Eligibility** | `checkEligibility.py` | Confirms student has not voted and meets election criteria. |
| **Add Candidate** | `addCandidate.py` | Admin adds candidates contesting for President/Secretary roles. |
| **Get Candidates** | `getCandidate.py` | Fetches active candidates for the voter ballot view. |
| **Start Election** | `startElection.py` | Admin initiates election window, opening voting. |
| **Get Election Status** | `getElectionStatus.py` | Returns election phase (`PENDING`, `LIVE`, `CLOSED`, `DECLARED`). |
| **Submit Vote** | `submitVote.py` | Records vote transaction with duplicate vote prevention. |
| **Stop Election** | `stopElection.py` | Admin freezes voting window; disables vote submission. |
| **Get Voting Results** | `getVotingResults.py` | Aggregates votes for administrative audit. |
| **Declare Result** | `declearResult.py` | Calculates winners and publishes election outcomes publicly. |
| **Reset Election Cycle** | `resetElectionCycle.py` | Clears election state for subsequent academic terms. |

### The 5 DynamoDB Tables
All tables configured in `PAY_PER_REQUEST` billing mode:

1. **`${project}-config`**: Stores election metadata, global flags, and current status (`config_key` [S]).
2. **`${project}-candidates`**: Contesting candidate profiles, assigned roles, and candidate IDs (`candidate_id` [S]).
3. **`${project}-votes`**: Records cast votes (`student_id` [S] as Hash Key, `role_voted_for` [S] as Range Key to enforce one vote per role per student).
4. **`${project}-users`**: Student user profiles and authentication mapping (`student_id` [S]).
5. **`${project}-attendance`**: Attendance eligibility master records (`student_id` [S]).

### Frontend Application (`frontend/`)
- Framework: React 18, React Router v6.
- UI Libraries: Material UI (`@mui/material`), Framer Motion, Emotion.
- Authentication Integration: AWS Amplify UI (`@aws-amplify/ui-react`) with Cognito OTP and password login.
- Offline Capability: Contains an internal mock layer (`frontend/src/mocks/mockApi.js`) allowing the interface to render and function offline for demonstration purposes.

---

## 3. Pre-Transformation Audit (Untrusted / Broken State)

Prior to starting the DevOps transformation, the repository was audited to identify broken, incomplete, or unverified configurations:

| Component | Current State | Audit Finding | Action Required |
| :--- | :--- | :--- | :--- |
| **Docker Build** | `docker/Dockerfile` | **Broken.** `COPY package.json` fails because compose passes context as root or relative paths without frontend directory awareness. | Rewrite using two-stage `frontend/Dockerfile` with clean relative paths. |
| **CI Pipeline** | `.github/workflows/ci.yml` | **Compromised.** Uses `bandit ... \|\| true`, `npm audit ... \|\| true`, masking pipeline failures. | Strip all `\|\| true`; enforce real gates on tests, build, and Trivy CVE scans. |
| **Infrastructure as Code** | Dual IaC in `infra/` | **Drift Risk.** Contains both Terraform (`infra/terraform/`, 676 lines) and CloudFormation (`infra/cloudformation/`, 35 KB). | Standardize on Terraform as single source of truth; archive CloudFormation as reference. |
| **README Metrics** | Root `README.md` | **Unverified Claims.** Claims `p99 180ms`, `<0.1% error rate`, and `500+ concurrent` with no reproducible test logs. | Remove unproven figures; replace with verified data logged in `docs/METRICS.md`. |

---

## 4. Target DevOps Engineering Layer

The new DevOps engineering work wraps the existing application in industry-standard automation:

```text
Source Control (Git)
        │
Automated CI (GitHub Actions: Lint -> Unit Tests -> Docker Build -> Trivy Scan)
        │
Deterministic Containerization (Two-Stage Docker: Node Builder -> Nginx Alpine)
        │
Infrastructure as Code (Terraform: Validated, Planned, Test-Applied & Destroyed)
        │
Local Orchestration (Kubernetes on kind: Deployment, Service, ConfigMap, Probes)
        │
Operational Verification (Incident RCA in docs/troubleshooting.md + docs/METRICS.md)
```

---

## 5. Baseline Verification Commands

Run these commands locally to verify the base application state before applying containerization or CI changes:

### Frontend Local Verification
```bash
cd frontend
yarn install
yarn test --watchAll=false
yarn build
```

### Python Lambda Syntax Check
```bash
python -m compileall backend/lambda
```

### Git Baseline Tag
Record the initial commit hash before making changes to reference in `docs/METRICS.md`.
