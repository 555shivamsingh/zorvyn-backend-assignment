# Fintech Role-Based Dashboard

A full-stack fintech management platform with secure role-based access, financial record management, and dashboard analytics.

## Overview

This project is split into:

- backend: Node.js + Express + Prisma + PostgreSQL
- frontend: React + Vite + Tailwind CSS

The system supports three user roles:

- Viewer: dashboard-only access
- Analyst: dashboard + financial records read access
- Admin: full access (users + records + dashboard)

## Key Features

### 1. User and Role Management

- Create users
- Update users
- Assign and update roles (VIEWER, ANALYST, ADMIN)
- Manage user status (ACTIVE, INACTIVE)
- Prevent self-deactivation for current admin user

### 2. Financial Records Management

- Create, list, update, and soft-delete financial records
- Record fields include amount, type, category, date, and notes
- Filtering by type, category, date range
- Pagination support for listing records

### 3. Dashboard Summary

- Total income
- Total expenses
- Net balance
- Top categories by amount
- Recent activity
- 30-day trend (income vs expense)

### 4. Access Control

Role enforcement is applied in backend middleware and route guards:

- Viewer: can access dashboard summary only
- Analyst: can access dashboard summary and list records
- Admin: full CRUD for records and full user management

### 5. Validation and Error Handling

- Input validation with Zod schemas
- Standardized API error shape
- Appropriate HTTP status codes (400, 401, 403, 404, 409, 422, 500)
- Prisma unique constraint handling

### 6. Data Persistence

- PostgreSQL via Prisma ORM
- Models: User, FinancialRecord
- Uses soft-delete (`isDeleted`) for records
- Optional cron job that calls a configured API endpoint every 14 minutes

## Tech Stack

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Zod
- JWT auth

### Frontend

- React
- Vite
- Tailwind CSS

## Project Structure

```
fintech/
  backend/
    prisma/
      schema.prisma
      seed.js
    src/
      config/
      lib/
      middleware/
      routes/
      schemas/
      index.js
    package.json

  frontend/
    src/
      App.jsx
      api.js
      index.css
      main.jsx
    package.json
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

## Environment Variables

Create environment files:

- backend/.env
- frontend/.env

### backend/.env

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
APP_JWT_SECRET="replace-with-at-least-32-characters"
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN="http://localhost:5173"
CRON_API_ENDPOINT="https://example.com/api/job"
SEED_ADMIN_EMAIL="admin@fintech.local"
SEED_ADMIN_PASSWORD="Admin@123"
```

### frontend/.env

```
VITE_API_BASE_URL="http://localhost:5000/api"
```

## Local Setup

### 1. Install dependencies

From project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Prepare database schema

From backend:

```bash
npm run db:generate
npx prisma db push
npm run db:seed
```

Notes:

- This project currently uses `prisma db push` for schema sync.
- `db:migrate` script exists, but no baseline migration folder is included by default.

### 3. Run application

Backend terminal:

```bash
cd backend
npm run dev
```

Frontend terminal:

```bash
cd frontend
npm run dev
```

Open app at: http://localhost:5173

## Default Seed Login

After seeding:

- Email: admin@fintech.local
- Password: Admin@123

Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in backend .env.

## Backend API Summary

Base URL: /api

### Health

- GET /health

### Auth

- POST /auth/login

### Users (Admin only)

- GET /users
- POST /users
- PATCH /users/:id

### Transactions

- GET /transactions (Admin, Analyst)
  - Query params: `type`, `category`, `from`, `to`, `page`, `pageSize`
- POST /transactions (Admin)
- PATCH /transactions/:id (Admin)
- DELETE /transactions/:id (Admin, soft-delete)

### Dashboard

- GET /dashboard/summary (Admin, Analyst, Viewer)

## Security Notes

- JWT required for protected endpoints
- Passwords hashed with bcrypt
- Inactive users cannot authenticate
- Basic API protection includes Helmet and rate limiting
- Scheduled endpoint calls are enabled with `CRON_API_ENDPOINT`

## Build Commands

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

### Backend

```bash
cd backend
npm start
```

## Future Improvements

- Add Prisma migration baseline and versioned migrations
- Add automated tests (unit + integration)
- Add API documentation (OpenAPI/Swagger)
- Add refresh token flow and session management
- Add audit logs for user and record changes
