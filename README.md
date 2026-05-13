# WeeklyQuest

WeeklyQuest is a full-stack web application where admins can create weekly question sets for groups or teams, and users can answer active weekly questions, view scores, and track history. This repository currently contains the Sprint 1 project scaffolding only; product features, authentication flows, and domain logic will be added in later sprints.

## Stack

- **Frontend:** React, TypeScript, Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Validation:** Zod
- **Auth dependencies:** bcrypt, jsonwebtoken, cookie-parser
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Local database:** Docker Compose

## Project structure

```text
weeklyquest/
  client/               # Vite React TypeScript frontend
  server/               # Express TypeScript API and Prisma schema
  docker-compose.yml    # Local PostgreSQL 16 service
  README.md
  .env.example
  .gitignore
```

## Environment setup

Copy the example environment file before running the app locally:

```bash
cp .env.example .env
```

The default values connect Prisma to the local Docker Compose PostgreSQL instance:

```text
postgresql://weeklyquest_user:weeklyquest_password@localhost:5432/weeklyquest_db?schema=public
```

## Run PostgreSQL

Start the local PostgreSQL 16 database:

```bash
docker compose up -d postgres
```

Stop it when finished:

```bash
docker compose down
```

To remove the persisted local database volume as well:

```bash
docker compose down -v
```

## Run the frontend

```bash
cd client
npm install
npm run dev
```

The Vite dev server runs at <http://localhost:5173> by default.

## Run the backend

```bash
cd server
npm install
npm run prisma:generate
npm run dev
```

The Express API runs at <http://localhost:4000> by default. The health check endpoint is available at:

```text
GET http://localhost:4000/api/health
```

## Useful commands

Frontend:

```bash
cd client
npm run typecheck
npm run build
```

Backend:

```bash
cd server
npm run typecheck
npm run build
npm run prisma:generate
```

## Sprint 1 next steps

- Implement real registration, login, logout, and current-user behavior.
- Add JWT cookie handling and protected route integration.
- Create the first Prisma migration for the initial `User` model.
- Add frontend form components and API wiring for auth flows.
- Start modeling groups, weekly question sets, answers, scores, and rankings.
- Add automated tests for API routes, validation, and frontend route guards.
