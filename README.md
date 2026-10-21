# ServiceNova

**Simplify Requests. Accelerate Solutions.**

A full-stack service request management application for the VisionRoot Software Engineering Intern technical assignment. Members submit and track requests; administrators manage work and workspace members. Requests, accounts, session revocation and dashboard metrics are persisted in SQLite through Prisma.

## Features

- Registration, login, logout and HttpOnly cookie sessions; no JWTs in localStorage.
- Separate member and administrator workspaces with protected routes and API authorization.
- Request creation, pending-only edits/cancellation, detail views and controlled status changes.
- Search, category/priority/status filters, newest/oldest sort and server-side pagination.
- Role-scoped dashboard metrics and recent requests from real stored data.
- Administrator user search, details, request counts and display-name updates.
- Responsive navigation, validation feedback, skeletons, empty/error states, toasts and confirmation dialogs.
- Controlled administrator seeding, migrations, OpenAPI and isolated automated tests.

## Technology and architecture

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Forms and HTTP | React Hook Form, Zod, Axios |
| Interface | Locally bundled Inter, Lucide React, Sonner |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Authentication | bcryptjs, signed JWTs in HttpOnly cookies |
| Database | Prisma ORM 7, SQLite, better-sqlite3 adapter |
| Tests | Vitest, Supertest, React Testing Library, Playwright Chromium |

React communicates with Express through `/api`. Middleware verifies origins, sessions and roles; services enforce ownership and request rules; the Prisma repository performs database queries and conditional writes. See [architecture and database schema](docs/database.md).

```text
frontend/
  src/
    components/ contexts/ hooks/ layouts/ pages/ services/ tests/ types/ utils/
  e2e/                  Real-browser full-stack workflows
backend/
  prisma/               Schema and checked-in SQL migrations
  scripts/              Cross-platform Prisma CLI wrapper
  src/
    controllers/ middleware/ repositories/ routes/ services/ tests/ types/ utils/ validators/
docs/
  api-contract.md       API behavior and response contract
  openapi.json          OpenAPI 3.0 endpoint documentation
  database.md           Schema, indexes, transactions and portability
  acceptance.md         Executed checks and submission tasks
  demo-checklist.md     Suggested interview/demo walkthrough
```

## Prerequisites

Use Node.js 22.12+ in the 22 LTS line, Node.js 24 LTS, or a version supported by the package engines, and npm. Commands below use `npm.cmd` for Windows PowerShell; use `npm` on macOS/Linux. No external database server is required.

## Installation and database setup

From the project root:

```powershell
cd backend
npm.cmd ci
Copy-Item .env.example .env
```

Skip the copy if `.env` already exists. Generate and write a random signing secret directly into the local environment file:

```powershell
node -e "const fs=require('node:fs'); const crypto=require('node:crypto'); const text=fs.readFileSync('.env','utf8'); fs.writeFileSync('.env',text.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+crypto.randomBytes(48).toString('hex')));"
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:status
```

Generating a new signing secret invalidates existing sessions. The SQLite database defaults to `backend/prisma/dev.db`. Migrations apply checked-in changes without resetting existing records. The local `.env` and database files are ignored by Git.

Install the frontend in another terminal from the project root:

```powershell
cd frontend
npm.cmd ci
```

## Start the application

Backend terminal, from the project root:

```powershell
cd backend
npm.cmd run dev
```

Frontend terminal, from the project root:

```powershell
cd frontend
npm.cmd run dev
```

Open http://localhost:5173/register to create a member account, or http://localhost:5173/login to sign in. Use `localhost` consistently in both the UI and API; switching to `127.0.0.1` changes the cookie host. Vite proxies `/api` to http://localhost:3000.

- Liveness: http://localhost:3000/api/health
- Database readiness: http://localhost:3000/api/ready

Stop either server with `Ctrl+C` in its terminal. The API checks table availability at startup; run migrations first. No default admin or runtime demo data is inserted automatically.

## Environment variables

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example).

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | development, test or production |
| `PORT` | API port, default 3000 |
| `JWT_SECRET` | Required random signing secret, 32+ characters |
| `SESSION_TTL_SECONDS` | 300–86400 seconds; default 28800 (8 hours) |
| `FRONTEND_ORIGINS` | Exact allowed browser origins; default localhost:5173 and 127.0.0.1:5173; production requires HTTPS |
| `DATABASE_URL` | Local SQLite file URL; relative paths resolve against backend/; required explicitly in production |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the explicit administrator seed command |
| `VITE_API_BASE_URL` | Frontend API base URL, default /api; public, never a place for secrets |

## Administrator setup

Choose an unused email address and set these in ignored `backend/.env`:

```dotenv
ADMIN_NAME=Your Administrator
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<choose a unique password of 12–128 characters>
```

Then, from `backend/`:

```powershell
npm.cmd run db:seed
```

The seed creates an ADMIN only when the email is unused. Existing admins are left unchanged; existing members are never promoted. Passwords use the same hashing helper as registration. Remove the admin password from `.env` after seeding if it is no longer needed. Public registration always creates USER accounts.

## Authentication and authorization

Sessions use HS256 JWTs with issuer, audience, expiry and a stored session version. The API reloads each user's role from the database. Logout invalidates all existing sessions for that user and clears the cookie. Cookies are HttpOnly, SameSite=Lax, and Secure with a host-only cookie name in production. Passwords use a SHA-256 base64 prehash followed by bcrypt cost 12 to avoid bcrypt's 72-byte truncation.

Every mutation requires an exact configured Origin, including login/logout and non-browser API clients. CORS is restricted to configured origins; Helmet, JSON/body limits, strict input schemas, rate limiting and safe errors are included. See [backend security details](backend/README.md).

Other members' request IDs return 404 to avoid disclosing resource existence. Role restrictions return 403. Frontend route guards and hidden buttons supplement authoritative backend checks.

## Business rules

| Action | Member | Administrator |
| --- | --- | --- |
| View requests | Own only | All |
| Create request | Own, automatically PENDING | Use a member account |
| Edit request | Own, PENDING only | Use a member account |
| Cancel request | Own, PENDING only | Use status endpoint |
| Change status | No arbitrary changes | Allowed transitions only |
| Manage users | No | Search/view/update display names |

```text
PENDING     -> IN_PROGRESS or CANCELLED
IN_PROGRESS -> RESOLVED or CANCELLED
RESOLVED / CANCELLED -> terminal
```

DELETE cancels a request and preserves its history. General PATCH never accepts status, owner or timestamps. Profile and roles are read-only in the UI. Status changes and pending edits use atomic database predicates to reject stale/concurrent actions.

## API reference

All resource responses use `{data: ...}`. Lists also include `pagination: {page,limit,totalItems,totalPages}`. Errors use `{error:{code,message,details?}}`.

| Methods | Paths |
| --- | --- |
| POST | /api/auth/register, /api/auth/login, /api/auth/logout |
| GET | /api/auth/me |
| GET, POST | /api/requests |
| GET, PATCH, DELETE | /api/requests/:id |
| PATCH | /api/requests/:id/status (admin only) |
| GET | /api/requests/metrics |
| GET | /api/users, /api/users/:id (admin only) |
| PATCH | /api/users/:id (admin display-name update) |
| GET | /api/health, /api/ready |

See [API contract](docs/api-contract.md) and import [openapi.json](docs/openapi.json) into Swagger Editor or Postman for schemas, authentication, restrictions and error codes.

## Testing and builds

Backend, from `backend/`:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run format:check
npm.cmd audit
```

Frontend, from `frontend/`:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run format:check
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e
```

Backend tests include 56 API/security tests using repository doubles and 20 tests against freshly migrated temporary SQLite databases. Frontend tests cover 14 validation, access and UI behaviors. Browser tests run a separate temporary database/API (3010) and Vite (5174), exercising real cookie authentication and stored requests. They do not reset or seed the development database. Test-only admin credentials are confined to this isolated environment.

The [acceptance checklist](docs/acceptance.md) records final executed checks and verification limits. Failed browser traces/screenshots appear in ignored `frontend/test-results/`.

## Production build notes

Backend: `npm.cmd run build`, then `npm.cmd start`. Apply migrations before startup and provide a persistent writable SQLite path, environment variables and HTTPS. The frontend's built `dist/` needs an SPA fallback to `index.html` plus an `/api` reverse proxy (or a configured API URL). `vite preview` is for local review, not production hosting. Proxy trust must match the actual deployment topology; it is disabled by default.

## Screenshots and verification

These screenshots were captured from Chromium with real API data in an isolated test database:

- [Member dashboard](docs/screenshots/member-dashboard.png)
- [Mobile request center](docs/screenshots/mobile-requests.png)

Verified in this workspace: both production builds, 76 backend tests, 14 frontend tests, four Chromium full-stack workflows, migration replay/status/schema consistency, compiled API health/readiness, formatting checks, and zero-vulnerability dependency audits. See [acceptance details](docs/acceptance.md) for the precise scope and remaining submission tasks.

## Assumptions and limitations

- SQLite targets a local assignment demo or one small server; PostgreSQL migration needs a new adapter/migrations and data transfer.
- Rate limiting uses per-process memory; multiple instances require a shared store.
- SQLite substring search has limited non-ASCII case folding and no full-text index.
- Logout signs the account out of all sessions. There is no password reset, email verification or role-changing API.
- The profile is read-only; administrators may update display names. Requests have no attachments, comments or audit timeline.
- Chromium tests include mobile viewport emulation; physical devices, Firefox/Safari, load tests and a complete accessibility audit remain outside verified coverage.
- No public deployment or demo video is claimed. Future improvements include password recovery, notifications, audit history, full-text search, shared rate limiting and PostgreSQL hosting.

Demo video: to be recorded; see [demo checklist](docs/demo-checklist.md).
