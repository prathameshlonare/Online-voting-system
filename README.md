# Rajiv Gandhi College of Engineering, Research & Technology - Voting System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Demo-green" alt="Status">
  <img src="https://img.shields.io/badge/React-18.2-blue" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

## ⚠️ Important Note - Demo Mode

> **This project is currently running in DEMO/PROTOTYPE mode.**
> 
> The original project used AWS Cognito, API Gateway, and S3 for backend services. For this public release, we have replaced all AWS integrations with **mock services** so anyone can download and test the application without needing AWS credentials.
>
> **To connect a real backend:** See the "Connecting Real Backend" section below.

---

## 📌 Project Overview

### Original Intent

This project was developed as a **mega project** for our college **Rajiv Gandhi College of Engineering, Research & Technology (RCERT), Chandrapur** to modernize the traditional **chit-based voting system** for student elections.

### Impact & Achievements

We successfully conducted the college voting election for **500+ students** using this system, which drastically impacted the original chit-based system:

| Before (Chit System) | After (Our System) |
|---------------------|-------------------|
| Manual counting of paper chits | Automatic digital vote counting |
| Time-consuming (hours/days) | Real-time results |
| Prone to human errors | Error-free processing |
| Difficult to verify fairness | Transparent & auditable |
| Physical presence required | Accessible anywhere |
| Limited to college premises | Vote from any device |

### Key Benefits Delivered

- ✅ **Fair & Secure** - No scope for vote manipulation
- ✅ **Time-Efficient** - Reduced election time from days to minutes
- ✅ **Convenient** - Students can vote from any device
- ✅ **Transparent** - Real-time result visibility for admins
- ✅ **Cost-Effective** - No paper, printing, or manual labor costs
- ✅ **Scalable** - Tested with 500+ students, can handle thousands

---

## 🏗️ Architecture Diagram
System Architecture
![System Architecture](./screenshots/architecture%20diagram/system_architecture.png)
Frontend & Backend Flow
![System Architecture](./screenshots/architecture%20diagram/front_&_Integration_flow.png)
---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18.2 |
| UI Framework | Material UI (MUI) |
| Routing | React Router v6 |
| Authentication | AWS Cognito (Mocked for demo) |
| API | AWS API Gateway (Mocked for demo) |
| Storage | AWS S3 (Mocked for demo) |
| Backend | AWS Lambda (Python 3.9) |
| Database | Amazon DynamoDB |
| PDF Generation | jsPDF + jspdf-autotable |

---

## 📁 Project Structure

```
voting-app/
├── Lambda Functions/              # AWS Lambda backend (Python)
│   ├── addCandidate.py           # Add election candidates
│   ├── checkEligibility.py       # Check student voting eligibility
│   ├── declearResult.py          # Declare election results
│   ├── getCandidate.py           # Get all candidates
│   ├── getElectionStatus.py      # Get current election status
│   ├── getVotingResults.py       # Get aggregated voting results
│   ├── resetElectionCycle.py     # Reset election for new cycle
│   ├── startElection.py          # Start the election
│   ├── stopElection.py           # Stop the election
│   ├── submitVote.py             # Submit student vote
│   ├── uploadStudentMaster.py    # Upload student CSV data
│   └── validateStudentRegistration.py  # Validate student registration
│
├── src/                          # React frontend
│   ├── index.js                  # Application entry point
│   ├── App.js                   # Main app component with routing
│   │
│   ├── mocks/                    # Mock AWS services (for demo)
│   │   ├── index.js             # Exports all mock services
│   │   ├── mockAuth.js          # Mock Cognito authentication
│   │   ├── mockApi.js           # Mock API Gateway responses
│   │   └── mockStorage.js       # Mock S3 storage
│   │
│   └── components/
│       ├── WelcomePage.js       # Landing page
│       ├── AuthForm.js          # Login/Signup form
│       ├── EnterOtp.js          # OTP verification
│       ├── VoteForm.js          # Student voting interface
│       └── AdminDashboard.js    # Admin control panel
│
├── screenshots/
│   ├── architecture diagram/    # AWS architecture diagrams
│   │   └── system_architecture.png
│   └── voting app photos/       # UI screenshots
│       ├── login_page.png
│       ├── sign_up_page.png
│       ├── vote_form.png
│       ├── vote_results.png
│       ├── add_candidate.png
│       └── election_control.png
│
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── logo.jpg
│
├── package.json
└── README.md
```

---

## ⚡ Lambda Functions

The backend is powered by **12 AWS Lambda functions** written in Python:

| Function | Description | Auth Required |
|---------|-------------|---------------|
| `addCandidate.py` | Add new candidates (President/Secretary) | Admin Only |
| `checkEligibility.py` | Check student eligibility based on attendance | Yes |
| `declearResult.py` | Declare election results | Admin Only |
| `getCandidate.py` | Retrieve all candidates | No (Public) |
| `getElectionStatus.py` | Get current election status | Optional |
| `getVotingResults.py` | Get aggregated voting results | Yes |
| `resetElectionCycle.py` | Reset election for new cycle | Admin Only |
| `startElection.py` | Start the election (RUNNING) | Admin Only |
| `stopElection.py` | Stop the election (STOPPED) | Admin Only |
| `submitVote.py` | Submit vote for President & Secretary | Yes |
| `uploadStudentMaster.py` | Upload student master CSV | Admin Only |
| `validateStudentRegistration.py` | Validate student registration | Yes |

### Election Status Flow:

```
┌──────────────┐      ┌─────────────┐      ┌────────────┐      ┌───────────────────┐
│ NOT_STARTED │─────►│   RUNNING   │─────►│  STOPPED  │─────►│ RESULTS_DECLARED │
└──────────────┘      └─────────────┘      └────────────┘      └───────────────────┘
                            │ (reset)
                            ▼
                     ┌──────────────┐
                     │ NOT_STARTED  │ ──► New Election Cycle
                     └──────────────┘
```

| State | Description |
|-------|-------------|
| NOT_STARTED | Initial state - election not yet started |
| RUNNING | Voting is active - students can vote |
| STOPPED | Voting ended - results pending |
| RESULTS_DECLARED | Results made public |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd voting-app

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at: **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@rcert.edu | password123 |
| Admin | admin@rcert.edu | admin123 |

### Demo Features

- **Student Login**: Can vote for President and Secretary
- **Admin Login**: Can manage candidates, control election, view results
- **Full Workflow**: Signup → OTP → Login → Vote → View Results

---

## 📋 Features

### For Students
- [x] Secure login/signup with email verification
- [x] Check voting eligibility based on attendance
- [x] View candidates for President and Secretary
- [x] Cast votes for both positions
- [x] View results after declaration

### For Administrators
- [x] Upload student attendance CSV
- [x] Add/manage election candidates
- [x] Control election status (Start/Stop/Declare/Reset)
- [x] View real-time voting results
- [x] Export results as PDF

### Election Management
- **NOT_STARTED** - Initial state
- **RUNNING** - Voting is active
- **STOPPED** - Voting ended, results pending
- **RESULTS_DECLARED** - Results made public

---

## 📸 Screenshots

| Screenshot | Description |
|------------|--------------|
| ![Login](./screenshots/voting%20app%20photos/login_page.png) | **Login Page** - Secure authentication |
| ![Sign Up](./screenshots/voting%20app%20photos/sign_up_page.png) | **Sign Up** - Registration with OTP |
| ![Vote Form](./screenshots/voting%20app%20photos/vote_form.png) | **Vote Form** - Cast votes |
| ![Results](./screenshots/voting%20app%20photos/vote_results.png) | **Results** - Winner display |
| ![Add Candidate](./screenshots/voting%20app%20photos/add_candidate.png) | **Add Candidates** - Admin panel |
| ![Election Control](./screenshots/voting%20app%20photos/election_control.png) | **Election Control** - Start/Stop/Declare |

---

## 🔌 Connecting Real Backend

To connect this demo to a real AWS backend:

1. **Create AWS Resources:**
   - AWS Cognito User Pool
   - API Gateway REST API
   - Lambda functions (see Lambda Functions folder)
   - DynamoDB Tables: Config, Candidates, Votes, Users, Attendance
   - S3 bucket for CSV storage

2. **Configure Credentials:**
   Create `src/aws-exports.js` with your AWS configuration:
   ```javascript
   const awsExports = {
     Auth: {
       region: 'us-east-1',
       userPoolId: 'us-east-1_YOUR_USER_POOL_ID',
       userPoolWebClientId: 'YOUR_CLIENT_ID',
       identityPoolId: 'us-east-1:YOUR_IDENTITY_POOL_ID'
     },
     API: {
       endpoints: [{
         name: "voteApi",
         endpoint: "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod",
         region: "us-east-1",
         authorizationType: "COGNITO_USER_POOLS"
       }]
     },
     Storage: {
       AWSS3: {
         bucket: 'your-bucket-name',
         region: 'us-east-1'
       }
     }
   };
   export default awsExports;
   ```

3. **Update Imports:**
   - In `src/index.js`: Import from `aws-amplify` instead of `./mocks`
   - Update all component imports similarly

---

## 👥 Team Members

| Name | Role | Email |
|------|------|-------|
| Prathamesh Lonare | **Project Lead & Frontend Developer** | prathameshlonare9@gmail.com |
| Swapnil Kumbhare | **DevOps & Security** | swapnilkumbhare706@gmail.com |
| Mohak Talodhikar | **Backend Developer** | mohaktalodhikar@gmail.com |
| Suyog Madavi | **UI/UX Designer** | suyogmadavi12@gmail.com |

---

## 📞 Contact

For any queries or collaboration opportunities, feel free to reach out to any team member:

- 📧 **Prathamesh Lonare**: prathameshlonare9@gmail.com
- 📧 **Swapnil Kumbhare**: swapnilkumbhare706@gmail.com
- 📧 **Mohak Talodhikar**: mohaktalodhikar@gmail.com
- 📧 **Suyog Madavi**: suyogmadavi12@gmail.com

---

## 📄 License

This project is available for educational purposes and as a portfolio demonstration.

---

## 🙏 Acknowledgments

- **RCERT (Rajiv Gandhi College of Engineering, Research & Technology)** - For giving us the opportunity to implement this system
- **Our Guides** - For their continuous support and guidance
- **Open Source Community** - For the amazing tools and libraries

---

<p align="center">
  Made with ❤️ by RCERT Students
</p>
