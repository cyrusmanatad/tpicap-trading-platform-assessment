# Trading Desk Application

A full-stack trading blotter built with React + TypeScript on the frontend and NestJS + PostgreSQL on the backend, with realtime Socket.IO updates for trade events.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: NestJS + TypeORM + PostgreSQL
- Realtime: Socket.IO
- Runtime: Docker Compose + Nginx

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or Docker Engine
- Docker Compose

## 1) Install dependencies

From the project root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Authentication and registration

The trading desk requires a user account before access is granted. Users can register a new desk profile or log in with an existing one. Successful authentication returns a JWT access token that is attached to protected API requests.

The app stores the token in local storage and sends it via the Authorization header for calls to protected routes such as `/trades`.

### Protected routes

Trade operations are protected by JWT authentication. If a session expires or the token is invalid, the frontend clears the current session and prompts the user to log back in.

## 2) Start PostgreSQL with Docker

From the project root:

```bash
docker compose up -d postgres
```

## 3) Start the backend

In a terminal:

```bash
cd backend
npm run start:dev
```

The backend runs on:

- http://localhost:3000
- Socket.IO: ws://localhost:3000/socket.io

## 4) Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The frontend runs on:

- http://localhost:5173

## 5) Start the full stack via Docker

From the project root:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port 5433
- Backend on port 3000
- Frontend on port 5173
- Nginx on port 81

Access the application on:

- http://localhost:81

## 6) Run tests

Backend tests:

```bash
cd backend
npm test
```

Frontend build validation:

```bash
cd frontend
npm run build
```

## Environment notes

- The frontend expects a Vite env var named `VITE_API_URL`.
- For local dev, the default is usually `http://localhost:3000`.
- For Docker, the frontend service sets this automatically to `http://localhost:3000`.

## Project structure

```text
.
├── backend/
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   └── default.conf
├── docker-compose.yml
├── .gitignore
├── README.md
└── .github/
```

## Useful commands

```bash
# backend dev server
cd backend && npm run start:dev

# backend production build
cd backend && npm run build

# frontend dev server
cd frontend && npm run dev -- --host 0.0.0.0

# frontend production build
cd frontend && npm run build

# full stack with Docker
cd /home/cyrusadmin/trading-app && docker compose up --build
```

## Notes

- The app seeds initial trade data on backend startup if the database is empty.
- Trade create, update, and cancel events are pushed through Socket.IO in realtime.
- The live status badge in the trading desk turns red during socket disconnects and returns to green on reconnect.
