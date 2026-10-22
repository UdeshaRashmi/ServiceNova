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
- Minimal light sidebar with remembered desktop collapse mode, role-specific links, account controls and a mobile drawer with Escape/focus handling.
- Public Home page with product introduction, features, Submit/Track/Resolve workflow, About ServiceNova and account entry links.
- Controlled administrator seeding, migrations, OpenAPI and isolated automated tests.

## Technology and architecture

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, React Router           |
| Forms and HTTP | React Hook Form, Zod, Axios                                   |
| Interface      | Locally bundled Inter, Lucide React, Sonner                   |
| Backend        | Node.js, Express 5, TypeScript, Zod                           |
| Authentication | bcryptjs, signed JWTs in HttpOnly cookies                     |
| Database       | Prisma ORM 7, SQLite, better-sqlite3 adapter                  |
| Tests          | Vitest, Supertest, React Testing Library, Playwright Chromium |

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

Open http://localhost:5173 for the public Home page. Use `/register` to create a member account or `/login` to sign in. Successful authentication opens the protected `/dashboard` page (or the protected page you originally requested). The workspace Overview link opens `/dashboard`; the logo and sidebar Home link return to public Home without signing out. Signed-in visitors can return using Home's Open dashboard button. Use `localhost` consistently in both the UI and API; switching to `127.0.0.1` changes the cookie host. Vite proxies `/api` to http://localhost:3000.

- Liveness: http://localhost:3000/api/health
- Database readiness: http://localhost:3000/api/ready

Stop either server with `Ctrl+C` in its terminal. The API checks table availability at startup; run migrations first. No default admin or runtime demo data is inserted automatically.

## Browse database data with Prisma Studio

After applying migrations, open a separate PowerShell terminal in the project root:

```powershell
cd backend
$studioDatabasePath = (Resolve-Path '.\prisma\dev.db').Path.Replace('\', '/')
node scripts/prisma.mjs studio --port 5555 --browser none --url "file:///$studioDatabasePath"
```

This builds the absolute Windows file URL automatically, including when the project path contains spaces. If you configured a different `DATABASE_URL`, replace `.\prisma\dev.db` with that database's actual file path.

Open http://localhost:5555 in your browser. Select **User** to view accounts, emails and roles, or **ServiceRequest** to view requests, owners, priorities and statuses. Studio reads the actual local database and can run independently of the frontend and API servers.

Keep the Studio terminal running while browsing. Stop it with `Ctrl+C`. If Studio is already running on port 5555, use its existing browser URL.

## Environment variables

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example).

| Variable                                      | Purpose                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                    | development, test or production                                                                     |
| `PORT`                                        | API port, default 3000                                                                              |
| `JWT_SECRET`                                  | Required random signing secret, 32+ characters                                                      |
| `SESSION_TTL_SECONDS`                         | 300–86400 seconds; default 28800 (8 hours)                                                          |
| `FRONTEND_ORIGINS`                            | Exact allowed browser origins; default localhost:5173 and 127.0.0.1:5173; production requires HTTPS |
| `DATABASE_URL`                                | Local SQLite file URL; relative paths resolve against backend/; required explicitly in production   |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the explicit administrator seed command                                                |
| `VITE_API_BASE_URL`                           | Frontend API base URL, default /api; public, never a place for secrets                              |

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

| Action         | Member                     | Administrator                    |
| -------------- | -------------------------- | -------------------------------- |
| View requests  | Own only                   | All                              |
| Create request | Own, automatically PENDING | Use a member account             |
| Edit request   | Own, PENDING only          | Use a member account             |
| Cancel request | Own, PENDING only          | Use status endpoint              |
| Change status  | No arbitrary changes       | Allowed transitions only         |
| Manage users   | No                         | Search/view/update display names |

```text
PENDING     -> IN_PROGRESS or CANCELLED
IN_PROGRESS -> RESOLVED or CANCELLED
RESOLVED / CANCELLED -> terminal
```

DELETE cancels a request and preserves its history. General PATCH never accepts status, owner or timestamps. Profile and roles are read-only in the UI. Status changes and pending edits use atomic database predicates to reject stale/concurrent actions.

## Swagger documentation

Start the frontend and backend, then open **[Swagger UI](http://localhost:5173/api/docs/)**. The raw specification is available at [OpenAPI JSON](http://localhost:5173/api/openapi.json). The same UI is also served at `http://localhost:3000/api/docs/`; for local interactive testing, use the frontend URL so the browser sends the configured trusted Origin.

1. Expand `POST /auth/login`, click **Try it out**, and enter your own account credentials in the JSON body.
2. If the Origin parameter is shown, enter `http://localhost:5173` (or your configured frontend origin). The browser supplies the actual Origin header; it cannot be spoofed by this field.
3. Click **Execute**. A successful login sets the HttpOnly session cookie automatically.
4. Test `GET /auth/me`, request listing, history and other permitted endpoints. Admin endpoints require an admin login.
5. Use `POST /auth/logout` to invalidate the session when finished.

The **Authorize** dialog is not needed for cookie login. Swagger's Execute buttons call the real API and mutations persist to the selected database. Sessions, role checks, validation and origin protection remain enforced. API rate limits also apply.

The specification in `docs/openapi.json` is the single source. Backend builds copy it to `backend/dist/openapi.json`; deploy that file with the compiled backend. Swagger JavaScript/CSS are served locally, and external spec validation is disabled. For a standalone backend or production reverse proxy, use a docs origin explicitly listed in `FRONTEND_ORIGINS` and route `/api` to the backend.

## API reference

All resource responses use `{data: ...}`. Lists also include `pagination: {page,limit,totalItems,totalPages}`. Errors use `{error:{code,message,details?}}`.

| Methods            | Paths                                                 |
| ------------------ | ----------------------------------------------------- |
| POST               | /api/auth/register, /api/auth/login, /api/auth/logout |
| GET                | /api/auth/me                                          |
| GET, POST          | /api/requests                                         |
| GET, PATCH, DELETE | /api/requests/:id                                     |
| PATCH              | /api/requests/:id/status (admin only)                 |
| GET                | /api/requests/metrics                                 |
| GET                | /api/users, /api/users/:id (admin only)               |
| PATCH              | /api/users/:id (admin display-name update)            |
| GET                | /api/health, /api/ready                               |

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

Backend tests include 57 API/security and documentation tests using repository doubles and 25 tests against freshly migrated temporary SQLite databases. Frontend tests cover 25 validation, access and UI behaviors, including sidebar collapse persistence, role-specific navigation and mobile drawer controls. Six browser workflows cover public Home navigation and the authenticated application, using a separate temporary database/API (3010) and Vite (5174). They do not reset or seed the development database. Test-only admin credentials are confined to this isolated environment.

The [acceptance checklist](docs/acceptance.md) records final executed checks and verification limits. Failed browser traces/screenshots appear in ignored `frontend/test-results/`.

## Production build notes

Backend: `npm.cmd run build`, then `npm.cmd start`. Apply migrations before startup and provide a persistent writable SQLite path, environment variables and HTTPS. The frontend's built `dist/` needs an SPA fallback to `index.html` plus an `/api` reverse proxy (or a configured API URL). `vite preview` is for local review, not production hosting. Proxy trust must match the actual deployment topology; it is disabled by default.

## Screenshots and verification

These screenshots were regenerated and visually inspected on 22 October 2026 using Chromium and an isolated test database. The desktop dashboard includes the current sidebar and status chart; the mobile request center shows its empty state:

- [Member dashboard](docs/screenshots/member-dashboard.png)
- [Mobile request center](docs/screenshots/mobile-requests.png)

Previously verified: both production builds, 76 backend tests, four Chromium full-stack workflows, migration replay/status/schema consistency, compiled API health/readiness, formatting checks, and zero-vulnerability dependency audits. The public Home and sidebar changes passed the frontend build and all 21 frontend tests. The updated five-workflow Chromium suite passed on 22 October 2026 after an approved run outside the sandbox, including history and dashboard chart assertions. See [acceptance details](docs/acceptance.md) for verification scope and remaining tasks.

## Assumptions and limitations

- SQLite targets a local assignment demo or one small server; PostgreSQL migration needs a new adapter/migrations and data transfer.
- Rate limiting uses per-process memory; multiple instances require a shared store.
- SQLite substring search has limited non-ASCII case folding and no full-text index.
- Logout signs the account out of all sessions. There is no password reset, email verification or role-changing API.
- The profile is read-only; administrators may update display names. Requests have no attachments or comments.
- Chromium tests include mobile viewport emulation; physical devices, Firefox/Safari, load tests and a complete accessibility audit remain outside verified coverage.
- No public deployment or demo video is claimed. Future improvements include password recovery, notifications, full-text search, shared rate limiting and PostgreSQL hosting.

Demo video: to be recorded; see [demo checklist](docs/demo-checklist.md).

## Request history and status chart

The dashboard shows a clickable status breakdown from role-scoped database totals, including cancellations. Request details include paginated activity with actor, time, edited field names and status changes. Existing requests start with a clearly labelled tracking baseline. Apply the additive migration with `cd backend` then `npm.cmd run db:migrate` and restart the backend after updating. No database reset or reseed is needed.

Verified for this update: both production builds, 81 backend tests, 25 frontend tests and database migration status. All five current Chromium workflows passed; refreshed desktop/mobile screenshots were inspected. A full visual review of the remaining Home/history states remains pending.
