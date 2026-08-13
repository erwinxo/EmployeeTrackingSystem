# Employee Tracking & Project Reporting System

A clean starter backend for an employee tracking and project reporting platform using Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, and Swagger.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the values in `.env` if needed.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for signing JWTs
- `JWT_EXPIRES_IN`: JWT expiration duration
- `NODE_ENV`: Environment mode

## Running Locally

```bash
npm run dev
```

The server will start at http://localhost:3000.

## Prisma Migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

## API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/api/docs
```
