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

Automated email sending, CI/CD, public HTTPS/domain hardening, monitoring dashboards, automated backups, and advanced production observability are intentionally not implemented yet.

## Self-Hosted Deployment

Sprint 10 adds the initial Docker-based production-like deployment path for running WeeklyQuest on a personal server. This setup is intentionally focused on containerized self-hosting only; it does not yet include automated email sending, CI/CD, public HTTPS/domain hardening, monitoring dashboards, automated backups, or advanced production observability.

### Production deployment files

- `docker-compose.prod.yml` starts PostgreSQL, the compiled backend, the built frontend, and a Caddy reverse proxy.
- `server/Dockerfile` installs backend dependencies, generates the Prisma client, builds the TypeScript API, and starts the compiled server with `npm run start`.
- `client/Dockerfile` builds the Vite frontend and serves the static production bundle with Nginx.
- `client/nginx.conf` serves `index.html` as a fallback so React Router routes such as `/dashboard`, `/profile`, `/invite/:token`, `/question-sets/:questionSetId`, and `/admin/users` work on refresh or direct navigation.
- `Caddyfile` routes `/api/*` to the backend service and all other requests to the frontend service.
- `.env.production.example` documents the production environment variables without committing real secrets.

The production frontend uses relative `/api` requests by default, which allows the reverse proxy to keep browser traffic on the same origin and forward API calls to the backend container.

### Prerequisites

- Docker installed on the server.
- Docker Compose installed on the server.
- This repository cloned on the server.

### Initial setup

From the repository root on your server:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and replace every placeholder value with real production secrets. At minimum, generate strong unique values for:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `COOKIE_SECRET`

Keep `.env.production` local to the server and do not commit it. Ensure `DATABASE_URL` uses the same PostgreSQL user, password, and database name as the `POSTGRES_*` values. In Docker Compose, the PostgreSQL hostname is `postgres`, not `localhost`.

If you are testing locally without a public domain, `CLIENT_ORIGIN=http://localhost` matches the default reverse proxy port. If you later put the app behind a real domain or HTTPS proxy, update `CLIENT_ORIGIN` to that browser origin.

### Build and start production containers

Use the production compose file with the production environment file:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Only the reverse proxy publishes a host port (`80:80`). PostgreSQL is kept on the internal Docker network and uses the persistent `postgres_data` volume.

### Run production Prisma migrations

After the containers are running, apply migrations with Prisma's deploy command:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

This keeps the migrations-based workflow and does not reset, delete, or reseed production data. Do not use `prisma migrate reset` against production data.

### Verify the deployment

Check the backend health endpoint through the reverse proxy:

```bash
curl http://localhost/api/health
```

Then open the app in a browser:

```text
http://localhost
```

When deploying to a server, replace `localhost` with the server IP address or configured host name. Public HTTPS/domain setup is intentionally outside this sprint's scope.

### Useful production commands

Start containers:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Stop containers without deleting database data:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

View logs for all services:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

View logs for one service:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

Rebuild after pulling code changes:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Run database migrations:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Local development remains unchanged

The existing local workflow still uses `docker-compose.yml` for local PostgreSQL, Vite for the frontend, and `npm run dev` for the backend. The production Docker Compose file is separate so local development does not need to run the production frontend, backend, or reverse proxy containers.
