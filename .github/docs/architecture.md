# Architecture

## Overview

The application uses a frontend/backend architecture.

React
  ↓
Nginx
  ↓
NestJS API
  ↓
PostgreSQL

## Frontend

Location:

/frontend

Responsibilities:

- User interface
- Client-side state
- API communication
- Form handling
- Data visualization

## Backend

Location:

/backend

Responsibilities:

- Authentication
- Business logic
- API endpoints
- Database operations

## Database

PostgreSQL stores persistent application data.


## Communication

Frontend communicates with the backend through REST APIs.

Backend communicates with PostgreSQL through the application's database layer.