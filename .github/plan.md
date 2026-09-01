# Trading Desk App Plan

## Overview
Build a full-stack trading desk application with a dark terminal-style front end, authenticated access, PostgreSQL persistence, and real-time trade updates. The application is split into a frontend app and a NestJS backend, with Docker and Nginx used to isolate services and serve the UI behind a single application entry point.

## Goals
- Deliver a trading blotter dashboard with market data, status, filters, KPI cards, and trade management actions.
- Keep the user experience aligned with the provided reference design in the terminal / blotter aesthetic.
- Persist trades and users in PostgreSQL with TypeORM.
- Secure the backend with JWT authentication and protect trade endpoints.
- Add real-time updates via Socket.IO for feed status and trade events.
- Support a polished login/register experience that reflects the reference HTML and shows the logged-in user identity in the desk header.

## Architecture
### Frontend
- React + TypeScript + Vite
- Dark trading-terminal design
- Auth gate for login/register before the desk is visible
- Trade list, filters, sorting, metrics, and drawer form for create/amend flows
- Token-aware API requests with Authorization headers
- Socket.IO integration for live feed status and trade change events

### Backend
- NestJS + TypeORM + PostgreSQL
- Auth module with JWT issuance and Passport JWT strategy
- Trades module with CRUD operations and event notifications
- Validation using Nest ValidationPipe and DTO classes
- Config-driven database setup with environment variables

### Infrastructure
- Docker Compose for app services
- PostgreSQL container on dedicated port
- Backend exposed on app port
- Frontend separate app container or dev server
- Nginx for reverse proxy or app serving when needed

## Current Implementation Direction

### 1. Authentication and user model
- Use a JWT-based auth flow for secure access.
- Store auth data in local storage on the frontend.
- Protect the trade API endpoints with a JWT guard.
- Extend the user entity beyond the minimal email/password model.
- Add fields to support the reference auth flow, including:
  - firstName
  - lastName
  - email
  - traderId
  - desk
  - passwordHash
- Keep the sign-in and register flows consistent with the reference UI design.

### 2. Trade persistence and backend API
- Persist trade data in PostgreSQL using TypeORM.
- Normalize trade fields for frontend display and metrics.
- Keep the REST contract consistent and support these operations:
  - list trades
  - create trade
  - update trade
  - cancel trade
- Ensure update/cancel routes use the correct identifier semantics in the URL.
- Ensure DTO validation prevents empty or malformed payloads.

### 3. Real-time trading events
- Use Socket.IO for trade-created, trade-updated, and trade-cancelled events.
- Emit feed-status events that reflect connected/disconnected state.
- Make the live status indicator in the UI turn red when the socket is disconnected.
- Keep event handling subtle and consistent with the trading desk UX.

### 4. Frontend trading desk UI
- Keep the main trading dashboard shell visually consistent with the blotter reference.
- Use KPI cards for key metrics.
- Show the live feed state, clock, and user badge in the header.
- Use the logged-in user identity in the header instead of a generic label.
- Match the trade table styling, side badges, and action buttons to the theme.

### 5. Reference design alignment
- Use the reference HTML as the UX blueprint for the auth screen and overall terminal styling.
- Match the dark palette, spacing, typography, button styles, and form controls.
- Restore the header ticker and the desk-access feel in the login/register screens.
- Apply consistent form tones for validation, strength meter, tabs, and controls.

## Detailed Workstreams

### Workstream A — Repo and environment setup
- Initialize git repository and maintain clean project hygiene.
- Add environment-driven configuration for Postgres, backend port, and frontend API URL.
- Keep Docker/compose setup isolated and simple for local runs.
- Add setup/run instructions in the project README.

### Workstream B — Backend auth foundation
- Create the `auth` module, controller, service, strategy, and guard.
- Add DTOs under the auth DTO folder.
- Add `User` entity with proper TypeORM column definitions.
- Add `ValidationPipe` globally in the bootstrap for runtime DTO enforcement.
- Validate login and register payloads with explicit rules.
- Keep auth flow public for register/login and protected for trade route access.

### Workstream C — Trade module and PostgreSQL integration
- Create the `trades` module with service and controller.
- Add `Trade` entity with status and side enums.
- Seed initial trade data if the database is empty.
- Connect the frontend to the backend for real trade loading.
- Replace local mock ticker/trade listings with backend-backed data.

### Workstream D — Frontend app state and API integration
- Build token/session helpers.
- Set and clear auth session in local storage.
- Include Authorization headers on protected requests.
- Handle login/register UI flows and auth errors.
- Keep the trading desk hidden until authentication succeeds.

### Workstream E — Realtime feed and live state
- Connect to Socket.IO after authentication.
- Listen for trade events and update the table state.
- Reflect live status with green/red indicator states.
- Ensure reconnect/disconnect transitions are visible to the user.

### Workstream F — Styling and UX fidelity
- Rework the login/register shell so it feels like a desk-access terminal.
- Match the provided dark theme, accent colors, panel borders, and typography.
- Update the header user badge to display the logged-in name based on the stored profile.
- Maintain current blotter behavior while aligning the styling and layout with the reference.

## File Map
- `backend/src/auth/user.entity.ts` — persisted user schema
- `backend/src/auth/auth.service.ts` — register/login, JWT creation, validation
- `backend/src/auth/auth.controller.ts` — public auth endpoints
- `backend/src/auth/dto/*.dto.ts` — request validation classes
- `backend/src/auth/jwt.strategy.ts` — JWT payload validation
- `backend/src/auth/jwt-auth.guard.ts` — protected route guard
- `backend/src/trades/trade.entity.ts` — persisted trade model
- `backend/src/trades/trades.service.ts` — trade CRUD and notifications
- `backend/src/trades/trades.controller.ts` — protected trade endpoints
- `backend/src/trades/trade-gateway.ts` — socket eventing
- `frontend/src/App.tsx` — app shell and auth gate
- `frontend/src/auth.ts` — session helpers and display-name logic
- `frontend/src/components/AuthForm.tsx` — auth UI form
- `frontend/src/App.css` — visual styling and terminal theme
- `frontend/login.html` — reference design for layout and UX cues

## Validation Steps
- Run backend auth tests to confirm registration/login still work with the richer user model.
- Run frontend build to confirm the UI and token-aware app compile cleanly.
- Manually verify:
  1. register a user with the richer profile
  2. sign in successfully
  3. confirm the header displays the real user name
  4. confirm the dashboard is protected without auth
  5. confirm the live feed indicator reflects connected/disconnected state

## Risks and Constraints
- User schema changes must remain compatible with app flows and existing auth logic.
- DTO validation must be strict enough to reject malformed payloads without breaking the frontend contract.
- Socket and API auth should stay aligned to avoid mismatched headers or missing tokens.
- UI fidelity should not compromise actual app functionality or route protection.

## Acceptance Criteria
- User can register and log in through the desk access experience.
- Backend stores user profile fields in the database and returns them in the JWT-authenticated session payload.
- Trade endpoints are protected behind JWT auth.
- Header displays the logged-in user name based on the stored profile.
- Frontend builds successfully and matches the reference styling direction.
- Realtime feed status is visible and changes between connected/disconnected states.

## Execution Sequence
1. Complete the backend user model and auth DTO refactor.
2. Ensure validation and JWT auth are active and stable.
3. Finalize frontend auth session and display name behavior.
4. Align the login/register screen to the reference dark desk aesthetic.
5. Validate the end-to-end flow and fix any remaining regressions.

## Summary
The project goal is a polished, secure, realtime trading desk that feels like a modern equities terminal while staying practical and production-ready. The work is organized around four pillars: secure auth, real persistence, live market updates, and terminal-grade UX fidelity.

### Workstream G — Client-side search debounce & cancellation
- Goal: prevent rate-limiting and stale results when users type quickly in the trade search.
- Quick step: add `frontend/src/hooks/useDebounce.ts` and use `useDebounce(search, 250)` in `frontend/src/App.tsx` to trigger `fetchTrades` only after the debounced value changes.
- Robust step: enhance `frontend/src/hooks/useTrades.ts` to abort in-flight fetches using `AbortController` and pass `signal` into `tradeApi` requests so paired requests (trades + summary) cancel together.
- Verification: rapid typing should issue requests only after debounce delay and canceled requests must not update UI out-of-order.
- Default debounce: 250ms (configurable).
