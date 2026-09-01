# Project Instructions — Trading Application

## Project Overview

This application is a trading application consisting of:

- React + TypeScript frontend
- NestJS + TypeScript backend
- PostgreSQL database
- Docker / Docker Compose for local development
- Nginx as the reverse proxy

The application handles trading-related operations, financial values, users, and other business-critical operations.

## General Rules

- Use TypeScript strict typing.
- Prefer existing project patterns over introducing new patterns.
- Do not introduce a new library when the existing dependencies can solve the problem.
- Keep business logic out of controllers.
- Controllers should handle HTTP concerns only.
- Services should contain business logic.
- Database access should follow the existing repository/data-access pattern.
- Do not modify database schema without considering existing data and migrations.
- Do not silently change existing business rules.
- Do not remove existing functionality unless explicitly requested.

### TypeScript Rules

Prefer explicit domain types over `any`.

Avoid:

```ts
const data: any = ...
```

unless there is a documented and unavoidable reason.

Prefer:

```ts
const data: TradeResponse = ...
```

Use:

* interfaces;
* type aliases;
* enums or union types;
* DTOs;
* domain-specific types.

Avoid unnecessary type assertions:

```ts
value as SomeType
```

If a type assertion is required, verify why the type system cannot establish the correct type naturally.

## Backend

- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- Use dependency injection provided by NestJS.
- Use DTOs for request validation.
- Use appropriate NestJS exceptions.
- Validate all external input.
- Keep controllers thin.
- Keep business logic inside services/domain modules.

The backend is the authoritative enforcement point for business rules.

## Frontend

- Framework: React
- Language: TypeScript
- Follow existing component patterns.
- Prefer reusable components over duplicated UI logic.
- Keep API communication separate from presentation components.
- Avoid unnecessary state.
- Preserve existing UX unless a change is explicitly requested.

The frontend must not be considered authoritative for business-critical rules.

Client-side validation improves UX but must not replace backend validation.

## Database

- Database: PostgreSQL
- Do not change existing schema without checking dependencies.
- Consider indexes when modifying queries.
- Consider transaction boundaries for multi-step operations.
- Avoid N+1 queries.
- For large tables, consider query performance and indexing.

## Testing

Before considering a feature complete:

1. Run the relevant tests.
2. Run TypeScript/build validation.
3. Check existing functionality affected by the change.
4. Add or update tests for important business logic.

## Code Changes

Before modifying code:

1. Understand the existing implementation.
2. Identify related modules.
3. Identify existing patterns.
4. Explain the proposed approach when the change is non-trivial.
5. Make the smallest reasonable change.
6. Validate the implementation afterward.

## AI Behavior

Do not assume that a requested implementation is correct simply because it is technically possible.

When requirements are ambiguous:

- identify the ambiguity;
- explain the possible interpretations;
- ask for clarification when the difference affects business behavior.

When modifying existing code:

- preserve existing behavior unless explicitly instructed otherwise;
- do not refactor unrelated code;
- do not introduce unnecessary abstractions.

When reviewing code, prioritize:

1. Correctness
2. Business logic
3. Security
4. Data integrity
5. Performance
6. Maintainability
7. Code style