# Docker — Local Development Environment

Containerized development setup with 3 services: React frontend, Node.js mock backend, and DynamoDB Local.

## Architecture

```
docker/
├── docker-compose.yml        # Development configuration
├── docker-compose.prod.yml   # Production overrides
├── Dockerfile                # Multi-stage frontend build (Node → nginx)
├── Dockerfile.backend        # Backend container (Node.js)
├── nginx.conf                # SPA routing, gzip, security headers
└── server.js                 # HTTP wrapper for mock API
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | React app served by nginx |
| `backend` | 4000 | Mock API server (simulates Lambda behavior) |
| `dynamodb` | 8000 | DynamoDB Local (in-memory) |

## Quick Start

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **DynamoDB Admin:** http://localhost:8001 (if using DynamoDB Admin UI)

## Network Isolation

```
┌─────────────────────────────────────────────────┐
│                  frontend-net                    │
│  ┌─────────────┐         ┌─────────────┐        │
│  │  frontend   │────────▶│   backend   │        │
│  │  :3000      │         │   :4000     │        │
│  └─────────────┘         └──────┬──────┘        │
│                                 │                │
└─────────────────────────────────┼────────────────┘
                                  │
                          ┌───────▼───────┐
                          │   backend-net  │
                          │  ┌───────────┐ │
                          │  │ dynamodb  │ │
                          │  │   :8000   │ │
                          │  └───────────┘ │
                          └────────────────┘
```

- **frontend-net:** Connects frontend → backend
- **backend-net:** Connects backend → DynamoDB
- Frontend **cannot** reach DynamoDB directly (isolation)

## Volume Persistence

DynamoDB data persists across restarts via named volume `dynamodb-data`:

```bash
# Data survives restarts
docker compose down
docker compose up -d
# Backend still returns data ✓

# To reset data completely
docker compose down -v
docker compose up -d
# Fresh state ✓
```

## Production Build

```bash
# Build optimized images
docker compose -f docker-compose.prod.yml build

# Run production stack
docker compose -f docker-compose.prod.yml up -d
```

### Image Optimization

| Stage | Base | Size |
|-------|------|------|
| Build | `node:22-alpine` | ~350MB |
| Production | `nginx:alpine` | ~25MB |

Multi-stage build reduces final image from 350MB → 25MB.

## Environment Variables

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | (empty) | Backend API URL. Set to `http://backend:4000` in Docker |

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `DYNAMODB_ENDPOINT` | `http://dynamodb:8000` | DynamoDB endpoint |
| `AWS_REGION` | us-east-1 | AWS region |
| `CONFIG_TABLE_NAME` | Config | DynamoDB Config table |
| `VOTES_TABLE_NAME` | Votes | DynamoDB Votes table |
| `CANDIDATES_TABLE_NAME` | Candidates | DynamoDB Candidates table |

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port
lsof -i :3000
kill <PID>
```

### Container won't start
```bash
# Check logs
docker compose logs frontend
docker compose logs backend

# Rebuild from scratch
docker compose down
docker compose up --build
```

### Reset everything
```bash
docker compose down -v --rmi local
docker compose up --build
```
