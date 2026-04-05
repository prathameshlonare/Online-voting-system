# Rajiv Gandhi College of Engineering, Research & Technology - Voting System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Demo-green" alt="Status">
  <img src="https://img.shields.io/badge/React-18.2-blue" alt="React">
  <img src="https://img.shields.io/badge/Tests-34%20passing-brightgreen" alt="Tests">
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

## ✨ What's New

- 🎉 **Confetti Celebration** — Animated confetti burst when a vote is successfully cast
- 📊 **Animated Results** — Growing progress bars, counting-up vote numbers, trophy entrance animation
- 🗳️ **Interactive Candidate Cards** — Click-to-select cards replacing boring dropdowns, with avatar initials and color-coded roles
- 🔴 **Live Status Indicator** — Pulsing dot showing real-time election state (Live/Ended/Results/Not Started)
- 📍 **Vote Progress Stepper** — Visual step tracker: Select → Review → Confirm → Done
- 💀 **Skeleton Loading States** — Shimmer placeholders while data loads instead of generic spinners
- 🎭 **Dynamic Role Management** — Admin can add/remove election positions (not just President/Secretary)
- 🌙 **Dark Cinematic Welcome Page** — Hero section with floating shapes, gradient text, glass-morphism cards
- ♿ **Full Accessibility** — WCAG 2.2 compliance with focus indicators, reduced motion, ARIA patterns
- 🎨 **Centralized Theme System** — Custom MUI theme with Playfair Display, Outfit, and JetBrains Mono fonts

---

## 🏗️ Architecture Diagram

### System Architecture
![System Architecture](./screenshots/architecture%20diagram/system_architecture.png)

### Frontend & Backend Flow
![System Architecture](./screenshots/architecture%20diagram/front_&_Integration_flow.png)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18.2 |
| UI Framework | Material UI (MUI) |
| Routing | React Router v6 |
| Animations | framer-motion, canvas-confetti |
| Testing | Jest, React Testing Library, @testing-library/user-event |
| Authentication | AWS Cognito (Mocked for demo) |
| API | AWS API Gateway (Mocked for demo) |
| Storage | AWS S3 (Mocked for demo) |
| Backend | AWS Lambda (Python 3.9) |
| Database | Amazon DynamoDB |
| PDF Generation | jsPDF + jspdf-autotable |
| Fonts | Playfair Display, Outfit, JetBrains Mono |

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
├── .github/workflows/
│   └── build.yml                 # GitHub Actions CI/CD pipeline
│
├── src/                          # React frontend
│   ├── index.js                  # Application entry point + ThemeProvider
│   ├── App.js                    # Main app component with routing
│   ├── theme.js                  # Centralized MUI theme configuration
│   ├── setupTests.js             # Jest test setup
│   │
│   ├── mocks/                    # Mock AWS services (for demo)
│   │   ├── index.js             # Exports all mock services
│   │   ├── mockAuth.js          # Mock Cognito authentication
│   │   ├── mockApi.js           # Mock API Gateway responses
│   │   └── mockStorage.js       # Mock S3 storage
│   │
│   ├── components/
│   │   ├── WelcomePage.js        # Dark cinematic landing page
│   │   ├── AuthForm.js           # Login/Signup/Forgot Password form
│   │   ├── EnterOtp.js           # OTP verification
│   │   ├── VoteForm.js           # Student voting interface
│   │   ├── AdminDashboard.js     # Admin control panel
│   │   ├── ConfettiCelebration.js# Confetti burst on vote success
│   │   ├── AnimatedResults.js    # Animated results with counters
│   │   ├── CandidateCard.js      # Interactive candidate selection card
│   │   ├── LiveStatusIndicator.js# Pulsing election status dot
│   │   ├── VoteProgressStepper.js# Vote step progress tracker
│   │   └── SkeletonLoaders.js    # Skeleton loading placeholders
│   │
│   └── *.test.js                 # Component test files (8 files, 34 tests)
│
├── screenshots/
│   ├── architecture diagram/     # AWS architecture diagrams
│   │   └── system_architecture.png
│   └── voting app photos/        # UI screenshots
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
| `addCandidate.py` | Add new candidates (any role) | Admin Only |
| `checkEligibility.py` | Check student eligibility based on attendance | Yes |
| `declearResult.py` | Declare election results | Admin Only |
| `getCandidate.py` | Retrieve all candidates | No (Public) |
| `getElectionStatus.py` | Get current election status | Optional |
| `getVotingResults.py` | Get aggregated voting results | Yes |
| `resetElectionCycle.py` | Reset election for new cycle | Admin Only |
| `startElection.py` | Start the election (RUNNING) | Admin Only |
| `stopElection.py` | Stop the election (STOPPED) | Admin Only |
| `submitVote.py` | Submit vote for all positions | Yes |
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

## 🧪 Testing

The project includes **34 tests** across **8 test suites** covering all major components.

### Running Tests

```bash
# Run all tests
npm test -- --watchAll=false

# Run with coverage report
npm test -- --watchAll=false --coverage
```

### Test Coverage

| Test File | Tests | Coverage |
|---|---|---|
| `LiveStatusIndicator.test.js` | 5 | All status states + unknown fallback |
| `VoteProgressStepper.test.js` | 3 | Step labels, icons, step transitions |
| `WelcomePage.test.js` | 6 | Heading, badge, subtitle, CTA, features, footer |
| `EnterOtp.test.js` | 4 | Heading, input, button, back link |
| `CandidateCard.test.js` | 6 | Name/party rendering, initials, click handler, edge cases |
| `AuthForm.test.js` | 6 | Form container, email/password fields, buttons, links |
| `App.test.js` | 1 | Module loads without errors |
| `AdminDashboard.test.js` | 3 | Dashboard heading, logout button, tabs |

### GitHub Actions

Tests run automatically on every push and pull request via `.github/workflows/build.yml`.

---

## ♿ Accessibility

This project follows **WCAG 2.2** guidelines:

- **Focus Indicators** — 3px outline with 3:1 contrast ratio on all interactive elements
- **Reduced Motion** — Respects `prefers-reduced-motion` system preference
- **ARIA Patterns** — Proper roles for tabs, dialogs, alerts, and landmarks
- **Screen Reader Support** — `aria-label`, `aria-labelledby`, `role="alert"` on error messages
- **Color Contrast** — All text meets minimum 4.5:1 ratio (WCAG AA)
- **Keyboard Navigation** — Full keyboard operability with visible focus states
- **Touch Targets** — All interactive elements are minimum 44×44px

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

### Available Scripts

| Command | Description |
|---|---|
| `npm start` | Run development server on http://localhost:3000 |
| `npm run build` | Create optimized production build in `build/` |
| `npm test` | Run test suite in watch mode |
| `npm test -- --watchAll=false` | Run tests once (for CI/CD) |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@rcert.edu | password123 |
| Admin | admin@rcert.edu | admin123 |

### Demo Features

- **Student Login**: Can vote for all available positions (dynamic roles)
- **Admin Login**: Can manage roles, candidates, control election, view results
- **Full Workflow**: Signup → OTP → Login → Vote → View Results

---

## 📋 Features

### For Students
- [x] Secure login/signup with email verification
- [x] Check voting eligibility based on attendance
- [x] View candidates as interactive cards for all positions
- [x] Cast votes with progress stepper (Select → Review → Confirm → Done)
- [x] Confetti celebration on successful vote
- [x] View animated results after declaration

### For Administrators
- [x] Upload student attendance CSV
- [x] **Dynamic role management** — Add/remove election positions
- [x] Add/manage election candidates for any role
- [x] Control election status (Start/Stop/Declare/Reset)
- [x] View animated real-time voting results
- [x] Export results as PDF
- [x] Live status indicator with pulsing animations

### Election Management
- **NOT_STARTED** - Initial state
- **RUNNING** - Voting is active
- **STOPPED** - Voting ended, results pending
- **RESULTS_DECLARED** - Results made public

---

## 📸 Screenshots

### User Flow

| Screenshot | Description |
|------------|--------------|
| ![Welcome Page](./screenshots/voting%20app%20photos/welcome_page.jpeg) | **Welcome Page** - Dark cinematic landing page with hero animations |
| ![Login](./screenshots/voting%20app%20photos/login_page.jpeg) | **Login Page** - Secure authentication |
| ![Sign Up](./screenshots/voting%20app%20photos/sign_up.jpeg) | **Sign Up** - Registration with email verification |

### Voting Experience

| Screenshot | Description |
|------------|--------------|
| ![Vote Form](./screenshots/voting%20app%20photos/vote_form.jpeg) | **Vote Form** - Interactive candidate cards with progress stepper |
| ![Vote Results](./screenshots/voting%20app%20photos/vote_result.jpeg) | **Vote Results** - Animated results with counters and trophy |

### Admin Dashboard

| Screenshot | Description |
|------------|--------------|
| ![Add Candidate](./screenshots/voting%20app%20photos/add_candidate.jpeg) | **Add Candidates** - Dynamic role management and candidate form |
| ![Election Control](./screenshots/voting%20app%20photos/election_control.jpeg) | **Election Control** - Live status indicator with Start/Stop/Declare |
| ![Results](./screenshots/voting%20app%20photos/results.jpeg) | **Results** - Admin view with animated charts and PDF export |

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
       AWS-S3: {
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

<p align="center">
  Made with ❤️ by RCERT Students
</p>
