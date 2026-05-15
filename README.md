# WeeklyQuest

WeeklyQuest is a full-stack web application where admins can create weekly question sets for groups or teams, and users can answer active weekly questions, view scores, and track history. This repository currently contains Sprint 1 authentication plus Sprint 2 group and membership management.

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

The default values connect Prisma to the local Docker Compose PostgreSQL instance. Set `JWT_SECRET` to a long random string because the backend signs HTTP-only authentication cookies with it, and keep `CLIENT_ORIGIN` aligned with the frontend dev server so cookie-based CORS requests are accepted:

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

## Sprint 1 authentication

Implemented auth endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Registration and login set a `weeklyquest_auth` HTTP-only JWT cookie. The frontend calls the API with credentials included, loads the current user from `/api/auth/me`, redirects unauthenticated users to `/login`, and redirects logged-in users away from `/login` and `/register` to `/dashboard`.

## Sprint 2 groups and memberships

Implemented group endpoints (all require authentication):

```text
GET    /api/groups
POST   /api/groups
GET    /api/groups/:groupId
PUT    /api/groups/:groupId
DELETE /api/groups/:groupId
GET    /api/groups/:groupId/members
POST   /api/groups/:groupId/members
DELETE /api/groups/:groupId/members/:userId
```

Admin users can create, update, and delete groups and manage memberships from `/admin/groups`. Regular users can only see groups they belong to on the dashboard. Apply database changes with:

```bash
cd server
npm run prisma:migrate -- --name add_groups_and_memberships
npm run prisma:generate
```

## Later sprint scope

Question sets, questions, submissions, scoring, leaderboards, email invites, and deployment workflows are intentionally not implemented yet.
