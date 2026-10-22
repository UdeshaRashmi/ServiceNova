# ServiceNova

**Simplify Requests. Accelerate Solutions.**

A full-stack service request management application for the VisionRoot Software Engineering Intern technical assignment. Members submit and track requests; administrators manage work and workspace members. Requests, accounts, session revocation and request activity are persisted in SQLite through Prisma. The application includes a public landing page, member/admin dashboards, request history and interactive Swagger documentation.

## Features

- Registration, login, logout and HttpOnly cookie sessions; no JWTs in localStorage.
- Separate member and administrator workspaces with protected routes and API authorization.
- Request creation, pending-only edits/cancellation, detail views and controlled status changes.
- Search, category/priority/status filters, newest/oldest sort and server-side pagination.
- Role-scoped dashboard metrics, clickable status charts and recent requests from real stored data.
- A dashboard with larger typography, soft colors, clear actions and responsive summary cards.
- Paginated request history showing who changed a request, when, edited field names and status transitions.
- Administrator user search, details, request counts and display-name updates.
- Responsive navigation, validation feedback, skeletons, empty/error states, toasts and confirmation dialogs.
- Minimal light sidebar with remembered desktop collapse mode, role-specific links, account controls and a mobile drawer with Escape/focus handling.
- Public Home page with product introduction, features, Submit/Track/Resolve workflow, About ServiceNova and account entry links.
- Controlled administrator seeding, additive migrations, locally served Swagger UI/OpenAPI and isolated automated tests.

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

React with Vite keeps the client separate from the REST API and provides a focused TypeScript development setup. Express separates routing, validation, business rules and persistence. Prisma provides typed database access and migrations; SQLite makes the assignment easy to run locally without a database service. Zod validates inputs on both sides, while the backend remains authoritative for security and workflow rules.

```text
frontend/
  src/
    components/ contexts/ hooks/ layouts/ pages/ services/ tests/ types/ utils/
  e2e/                  Real-browser full-stack workflows
backend/
  prisma/               Schema and checked-in SQL migrations
  scripts/              Prisma CLI wrapper and OpenAPI build copy
  src/
    controllers/ middleware/ repositories/ routes/ services/ tests/ types/ utils/ validators/
    swagger.ts          Swagger UI and raw OpenAPI routes
docs/
  api-contract.md       API behavior and response contract
  openapi.json          OpenAPI 3.0 endpoint documentation
  database.md           Schema, indexes, transactions and portability
  acceptance.md         Executed checks and submission tasks
  accessibility.md      Review scope, fixes, report commands and limits
  demo-checklist.md     Suggested interview/demo walkthrough
  screenshots/          Verified desktop/mobile captures
```

## Prerequisites

Use Node.js matching the package engines (`^22.12.0 || ^24.0.0 || >=26.0.0`) and npm. Commands below use `npm.cmd` for Windows PowerShell; use `npm` on macOS/Linux. No external database server is required.

## Installation and database setup

From the project root:

```powershell
cd backend
npm.cmd ci
Copy-Item .env.example .env
```

Skip the copy if `.env` already exists. For first-time setup, generate and write a random signing secret directly into the local environment file. Keep an existing configured signing secret when returning to the project:

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
- Interactive Swagger UI: http://localhost:5173/api/docs/
- Raw OpenAPI JSON: http://localhost:3000/api/openapi.json

Stop either server with `Ctrl+C` in its terminal. The API checks table availability at startup; run migrations first. No default admin or runtime demo data is inserted automatically.

## Browse database data with Prisma Studio

After applying migrations, open a separate PowerShell terminal in the project root:

```powershell
cd backend
$studioDatabasePath = (Resolve-Path '.\prisma\dev.db').Path.Replace('\', '/')
node scripts/prisma.mjs studio --port 5555 --browser none --url "file:///$studioDatabasePath"
```

This builds the absolute Windows file URL automatically, including when the project path contains spaces. If you configured a different `DATABASE_URL`, replace `.\prisma\dev.db` with that database's actual file path.

Open http://localhost:5555 in your browser. Select **User** to view accounts, emails and roles, **ServiceRequest** to view requests, owners, priorities and statuses, or **RequestActivity** to view recorded changes and actors. Studio reads the actual local database and can run independently of the frontend and API servers.

Keep the Studio terminal running while browsing. Stop it with `Ctrl+C`. If Studio is already running on port 5555, use its existing browser URL.

## Database overview

| Model             | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `User`            | Account details, password hash, role and session version              |
| `ServiceRequest`  | Request content, owner, category, priority, status and timestamps     |
| `RequestActivity` | Creation, edits, status changes and migration-time tracking baselines |

A user owns many requests; a request has many activity events. Activity references an optional actor. Unique email, foreign keys, enum checks and listing/history indexes support data integrity and retrieval. Mutations and their activity entries commit together. See [database documentation](docs/database.md) for the schema, migrations and transaction details.

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

## Request history and status chart

Open **My requests** (member) or **All requests** (admin), then click a request title. The **Request history** timeline appears below **Request details**. It lists creation, actual edits and status transitions, newest first, with actor and timestamp. Older entries are available through pagination. Actor names reflect the current account display name; edited field names are recorded without storing previous description content.

Requests that existed before activity tracking have a clearly labelled **History tracking started** event. Earlier changes cannot be reconstructed. Rejected actions and edits that do not change values create no events.

The dashboard chart uses role-scoped database totals for Pending, In Progress, Resolved and Cancelled. Clicking a chart row or summary card opens the corresponding request list. New accounts see empty states rather than sample data.

## Swagger documentation

Start the frontend and backend, then open **[Swagger UI](http://localhost:5173/api/docs/)**. The raw specification is available at [OpenAPI JSON](http://localhost:5173/api/openapi.json). The same UI is also served at `http://localhost:3000/api/docs/`; for local interactive testing, use the frontend URL so the browser sends the configured trusted Origin.

1. Expand `POST /auth/login`, click **Try it out**, and enter your own account credentials in the JSON body.
2. If the Origin parameter is shown, enter `http://localhost:5173` (or your configured frontend origin). The browser supplies the actual Origin header; it cannot be spoofed by this field.
3. Click **Execute**. A successful login sets the HttpOnly session cookie automatically.
4. Test `GET /auth/me`, request listing, history and other permitted endpoints. Admin endpoints require an admin login.
5. Use `POST /auth/logout` to invalidate the session when finished.

The **Authorize** dialog is not needed for cookie login. Swagger's Execute buttons call the real API and mutations persist to the selected database. Sessions, role checks, validation and origin protection remain enforced. API rate limits also apply.

The specification in [docs/openapi.json](docs/openapi.json) is the single source; this is the file to open in your editor or import into Postman. Backend builds copy it to `backend/dist/openapi.json`; deploy that file with the compiled backend. Swagger JavaScript/CSS are served locally, and external spec validation is disabled. For a standalone backend or production reverse proxy, use a docs origin explicitly listed in `FRONTEND_ORIGINS` and route `/api` to the backend.

## API reference

All resource responses use `{data: ...}`. Lists also include `pagination: {page,limit,totalItems,totalPages}`. Errors use `{error:{code,message,details?}}`.

| Methods            | Paths                                                 |
| ------------------ | ----------------------------------------------------- |
| POST               | /api/auth/register, /api/auth/login, /api/auth/logout |
| GET                | /api/auth/me                                          |
| GET, POST          | /api/requests                                         |
| GET, PATCH, DELETE | /api/requests/:id                                     |
| GET                | /api/requests/:id/history (owner or admin)            |
| PATCH              | /api/requests/:id/status (admin only)                 |
| GET                | /api/requests/metrics                                 |
| GET                | /api/users, /api/users/:id (admin only)               |
| PATCH              | /api/users/:id (admin display-name update)            |
| GET                | /api/docs/, /api/openapi.json                         |
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
npm.cmd exec -- playwright show-report
```

Backend tests include 30 isolated request-service unit tests, 58 API/security/documentation checks using repository doubles and 25 tests against freshly migrated temporary SQLite databases (113 total). Frontend tests cover 30 validation, access and UI behaviors, including sidebar collapse persistence, role-specific navigation and mobile drawer controls. Twelve browser workflows cover public Home navigation and the authenticated application, using a separate temporary database/API (3010) and Vite (5174). They do not reset or seed the development database. Test-only admin credentials are confined to this isolated environment.

The [acceptance checklist](docs/acceptance.md) records final executed checks and verification limits. Failed browser traces/screenshots appear in ignored `frontend/test-results/`.

## Production build notes

Backend: `npm.cmd run build`, then `npm.cmd start`. Apply migrations before startup and provide a persistent writable SQLite path, environment variables and HTTPS. The frontend's built `dist/` needs an SPA fallback to `index.html` plus an `/api` reverse proxy (or a configured API URL). `vite preview` is for local review, not production hosting. Proxy trust must match the actual deployment topology; it is disabled by default.

## Screenshots and verification

These screenshots were regenerated and visually inspected on 22 October 2026 using Chromium and an isolated test database. The desktop dashboard includes the current sidebar and status chart; the mobile request center shows its empty state:

- [Member dashboard](docs/screenshots/member-dashboard.png)
- [Mobile request center](docs/screenshots/mobile-requests.png)

Latest executed checks: backend and frontend production builds passed, along with **113 backend tests**, **30 frontend tests** and **12 Chromium workflows**. Browser coverage includes six full-stack workflows and six desktop/mobile accessibility scenarios. The accessibility checks cover public pages, member/admin screens, forms/errors, history, dialogs, keyboard focus and page overflow at 1280px and 320px. Swagger Try it out and cookie authentication remain covered. The compiled backend also served the packaged Swagger UI and OpenAPI document successfully.

Desktop and mobile dashboard captures were visually inspected after the dashboard redesign. Automated accessibility and keyboard checks are documented in [accessibility review](docs/accessibility.md). Physical-device, assistive-technology and full WCAG reviews remain pending. See [acceptance details](docs/acceptance.md) for verification scope and submission tasks.

## Troubleshooting

| Symptom                                                        | What to check                                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Database is unavailable or migrations have not been applied.` | From `backend/`, run `npm.cmd run db:status`, `npm.cmd run db:migrate` and `npm.cmd run db:generate`, then restart the backend. Confirm `DATABASE_URL` points to the intended writable SQLite file. |
| `Unable to start API listener. Check PORT and permissions.`    | Another server may already use port 3000. Stop the duplicate backend terminal with `Ctrl+C`, then start one backend process. If changing `PORT`, update the Vite proxy target too.                  |
| Swagger mutations return an origin error                       | Open `http://localhost:5173/api/docs/` and use the exact frontend origin configured in `FRONTEND_ORIGINS`. Changing an Origin input cannot override the browser's actual Origin.                    |
| Swagger returns 404 after updating                             | Restart the backend so the new routes load. For `npm.cmd start`, rebuild first with `npm.cmd run build`.                                                                                            |
| PowerShell blocks `npm.ps1`                                    | Use the documented `npm.cmd` commands.                                                                                                                                                              |
| Browser tests cannot start their API                           | Ports 3010 and 5174 must be available. A restricted execution environment may require permission to launch its child processes.                                                                     |

If the backend port differs from 3000, start Vite with the matching target in its terminal, for example `$env:API_PROXY_TARGET = "http://localhost:3001"` before `npm.cmd run dev`. The API's `/api/ready` endpoint confirms database readiness.

## Assumptions and limitations

- SQLite targets a local assignment demo or one small server; PostgreSQL migration needs a new adapter/migrations and data transfer.
- Rate limiting uses per-process memory; multiple instances require a shared store.
- SQLite substring search has limited non-ASCII case folding and no full-text index.
- Logout signs the account out of all sessions. There is no password reset, email verification or role-changing API.
- The profile is read-only; administrators may update display names. Requests have no attachments or comments.
- Chromium tests include mobile viewport emulation; physical devices, Firefox/Safari, load tests and a complete accessibility audit remain outside verified coverage.
- No public deployment or demo video is claimed. Future improvements include password recovery, notifications, full-text search, shared rate limiting and PostgreSQL hosting.

Demo video: to be recorded; see [demo checklist](docs/demo-checklist.md).

## Form validation

Frontend forms use React Hook Form and Zod, with feedback after a field is touched and invalid submissions focused on the first failing field. The backend validates independently, including requests sent outside the browser.

| Field                 | Validation                                                         |
| --------------------- | ------------------------------------------------------------------ |
| Full/display name     | Trimmed, 2-100 characters                                          |
| Email                 | Valid email, at most 254 characters, trimmed and lowercased        |
| Registration password | 8-128 characters; password text is not trimmed                     |
| Login password        | Nonempty, at most 128 characters; verified against the stored hash |
| Request title         | Trimmed, 5-150 characters                                          |
| Request description   | Trimmed, 20-5,000 characters                                       |
| Category/priority     | Only the documented enum values                                    |
| Search text           | At most 200 characters; blank search clears the text filter        |

Create/edit forms share the same request rules. Inputs include browser length constraints and accessible field errors. Status, owner, role and timestamps remain controlled by the backend rather than editable form fields.
