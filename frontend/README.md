# Frontend — React Voting Application

A responsive React-based voting interface built with Material UI, featuring real-time election status, animated results, and OTP-based voter verification.

## Architecture

```
frontend/
├── public/                    # Static assets (favicon, manifest)
├── src/
│   ├── api/                   # API layer (mock/HTTP switcher)
│   │   ├── index.js          # Exports mock or HTTP client based on env
│   │   └── httpClient.js     # Real HTTP client for Docker/production
│   ├── mocks/                 # Mock AWS services (local dev)
│   │   ├── mockAuth.js       # Cognito authentication mock
│   │   ├── mockApi.js        # API Gateway mock
│   │   └── mockStorage.js    # S3 storage mock
│   ├── components/            # React components
│   │   ├── AuthForm.js       # Login/signup form
│   │   ├── VoteForm.js       # Voting ballot interface
│   │   ├── AdminDashboard.js # Election management panel
│   │   ├── EnterOtp.js       # OTP verification step
│   │   ├── WelcomePage.js    # Landing page
│   │   ├── CandidateCard.js  # Individual candidate display
│   │   ├── AnimatedResults.js # Animated vote count visualization
│   │   ├── ConfettiCelebration.js # Winner celebration effect
│   │   ├── LiveStatusIndicator.js # Real-time election status
│   │   ├── VoteProgressStepper.js # Multi-step voting flow
│   │   └── SkeletonLoaders.js # Loading state placeholders
│   ├── App.js                 # Main app with React Router
│   ├── index.js               # Entry point
│   └── theme.js               # MUI theme configuration
├── package.json
└── yarn.lock
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password signup with OTP confirmation via Cognito mocks |
| **Voting Flow** | Multi-step process: Login → OTP → Select Candidate → Confirm → Submit |
| **Admin Dashboard** | Start/stop elections, manage candidates, declare results |
| **Real-time Status** | Live election state indicator (Not Started / Active / Ended) |
| **Animated Results** | Bar chart animations with confetti celebration for winners |
| **Responsive** | Mobile-first design with Material UI components |
| **WCAG 2.2 AA** | Accessible color contrast, keyboard navigation, screen reader support |

## Tech Stack

- **React 18** — Functional components with hooks
- **Material UI (MUI)** — Component library and theming
- **React Router v6** — Client-side routing
- **Axios** — HTTP client (production mode)

## Local Development

```bash
# Install dependencies
cd frontend
yarn install

# Run with mocks (no backend needed)
yarn start

# Run with Docker backend
REACT_APP_API_URL=http://localhost:4000 yarn start
```

The app runs on `http://localhost:3000` by default.

## API Modes

The frontend automatically switches between two modes:

| Mode | When | Backend |
|------|------|---------|
| **Mock** | `REACT_APP_API_URL` not set | In-memory mocks (no server needed) |
| **HTTP** | `REACT_APP_API_URL` set | Real backend at that URL |

This allows frontend development without any backend infrastructure.

## Build

```bash
# Production build (creates optimized bundle in build/)
yarn build

# The Docker build uses this automatically via multi-stage Dockerfile
```
