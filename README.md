# ServiceNova

**Simplify Requests. Accelerate Solutions.**

A service request management application for the VisionRoot Software Engineering Intern assignment. Development is split into three reviewable commits: frontend, backend, and database/integration.

## Current status

The React frontend is implemented. The backend and database are pending. Authentication, dashboards, and request operations need the real API; there is no mock login, seeded browser data, or fabricated dashboard statistics. Test fixtures exist only in automated tests.

## Frontend setup

Requirements: Node.js 22.12+ or Node.js 24 LTS and npm.

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the Local URL printed by Vite (normally http://localhost:5173). On macOS/Linux, use `npm` instead of `npm.cmd`. On Windows, `npm.cmd` works without changing PowerShell execution policy.

The public login and registration pages work without the backend for visual review and client validation. Submitting credentials requires the API. Protected pages intentionally require an authenticated server session; their real data cannot be reviewed until the backend is available.

Vite proxies `/api` to `http://localhost:3000`. Optionally copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`. Client environment variables are public; never put secrets in them. Cookie authentication uses Axios `withCredentials`; no tokens are stored in localStorage.

```powershell
cd frontend
npm.cmd run build
npm.cmd test
npm.cmd run format:check
npm.cmd run preview
```

The production frontend needs a host with SPA fallback to `index.html` and an `/api` reverse proxy (or an explicitly configured API URL). `vite preview` serves the build for local review, not as a production server.

Verified in this workspace: production build, 14 automated tests, formatting check, zero-vulnerability dependency audit, and an HTTP 200 response from the development server. Manual browser/device review and real backend flows remain unverified.

## Frontend architecture

```text
frontend/
  src/
    components/  Shared UI, request form, request table, pagination
    contexts/    Cookie-session authentication state
    hooks/       Async loading and stale-response protection
    layouts/     Responsive workspace shell
    pages/       Auth, dashboards, requests, users, profile
    services/    Axios API client and typed endpoint functions
    tests/       Form validation, route access, request-action checks
    types/       User, request, pagination and status types
    utils/       Display formatting
docs/
  api-contract.md
  progress.md
```

Stack: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Zod, Lucide, Sonner. Inter is bundled locally. The UI uses reusable panels, status badges, confirmation dialogs, loading skeletons, empty states, and error/retry states.

## Application routes

| Route | Purpose |
| --- | --- |
| `/login`, `/register` | Public authentication forms |
| `/` | Role-aware dashboard |
| `/requests` | Requests with server-side search, filters, sort, pagination |
| `/requests/new` | Member request creation |
| `/requests/:id` | Request details and permitted actions |
| `/requests/:id/edit` | Edit own pending request |
| `/users`, `/users/:id` | Administrator member list and name updates |
| `/profile` | Read-only current account profile |
| Other paths | 404 |

Frontend guards and action visibility improve UX. The backend must independently enforce authentication, ownership, roles, and status transitions. See [API contract](docs/api-contract.md) and [progress](docs/progress.md).

## Pending work

- Express API, password hashing, signed HttpOnly cookie sessions, CSRF/origin checks, validation, authorization, rate limiting, and error handling.
- Prisma schema, SQLite migrations, controlled administrator seeding, and isolated API test database.
- End-to-end integration, API tests, OpenAPI documentation, security verification, and final acceptance testing.
- Backend environment instructions and architecture decisions will be documented with their actual implementation.

No deployment, screenshots, demo recording, or browser/device acceptance testing is claimed.

Demo video: to be recorded after full integration.
