# ServiceNova API

Express 5 + TypeScript REST API. Controllers parse input, middleware handles sessions/security, reusable services enforce business rules, and the `Repository` interface separates persistence from application logic.

**Current stage:** API behavior is implemented and tested using a repository test double. The runtime deliberately uses `UnavailableRepository` until the database commit. No requests or accounts are stored in memory at runtime. Login/registration and stored-data operations cannot succeed until the Prisma adapter is connected. `/api/health` is live; `/api/ready` returns 503.

## Local setup (PowerShell)

From the project root:

```powershell
cd backend
npm.cmd ci
Copy-Item .env.example .env
```

Generate a secret and write it directly into `.env` without printing it:

```powershell
node -e "const fs=require('node:fs'); const crypto=require('node:crypto'); const text=fs.readFileSync('.env','utf8'); fs.writeFileSync('.env',text.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+crypto.randomBytes(48).toString('hex')));"
npm.cmd run dev
```

Do not overwrite an existing `.env`. The session's implementation may already have generated a local `.env`; in that case use `npm.cmd run dev` directly. `.env` is ignored by Git. No secrets belong in source or frontend environment variables.

Open http://localhost:3000/api/health. Keep the frontend in a second terminal (`cd frontend`, `npm.cmd run dev`). Vite forwards `/api` to port 3000. Use `localhost` consistently; `127.0.0.1` and `localhost` have different cookie hosts.

```powershell
npm.cmd run build
npm.cmd start
npm.cmd test
npm.cmd run format:check
npm.cmd audit
```

`build` emits `dist/` and excludes test code. `start` runs compiled JavaScript. Node loads `.env` through its native environment-file support. Test code injects isolated configuration and never reads the local `.env` or accesses a database.

## Environment

| Variable | Meaning |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API port; default 3000 |
| `JWT_SECRET` | Required random signing secret, at least 32 characters |
| `SESSION_TTL_SECONDS` | Session expiry, 300–86400 seconds; default 28800 (8 hours) |
| `FRONTEND_ORIGINS` | Comma-separated exact browser origins; no wildcards/paths/trailing slashes; production requires HTTPS |

## Security behavior

- JWTs use HS256 with an explicit algorithm allow-list, issuer, audience, expiry, and session version. No role or owner from the frontend is trusted.
- Every authenticated request reloads the current user and role from the repository.
- Logout increments a stored session version, invalidating **all existing sessions for that user**, then clears the cookie. Expired/absent-session logout is idempotent. Storage failures are reported rather than claiming successful revocation.
- Cookies are HttpOnly, `SameSite=Lax`, and scoped to `/`. Production uses the `__Host-servicenova_session` name, `Secure`, and no Domain attribute. Development uses `servicenova_session` over local HTTP.
- Every state-changing request requires a configured `Origin`, including login, registration, and logout. CORS accepts only these exact origins with credentials. Postman/curl clients must explicitly send a trusted `Origin` header too.
- POST/PATCH resource bodies must be JSON. Request bodies are limited to 32 KiB; Zod rejects unknown fields, invalid IDs, enum values, lengths, and unsupported query options.
- Passwords support up to 128 characters. A domain-separated SHA-256 base64 prehash feeds bcryptjs (cost 12), preventing bcrypt's 72-byte truncation for long/Unicode passwords. Future administrator seeds must use the same `hashPassword` helper.
- Password hashes and session versions never appear in user JSON. Unexpected failures return a generic 500; request bodies, secrets and database error details are not logged.
- Helmet adds security headers. Responses use `Cache-Control: no-store`.
- General API traffic is limited to 300 requests per 15 minutes per IP; login/registration share a 20-attempt limit. Rate limits use per-process memory; a shared rate-limit store is needed for multiple instances.

The server does not trust proxy headers by default. A production deployment must configure the exact trusted proxy topology before enabling proxy-derived client IPs, and serve the app/API over HTTPS on a compatible site. Arbitrary cross-site cookie hosting is not supported by the current SameSite policy.

## Request rules

Members create requests with server-derived ownership and `PENDING` status. Members can read only their own requests, and edit/cancel only while pending. DELETE means cancellation, not physical deletion. Other owners' resources return 404. Administrators read all requests and use the separate status endpoint; general member create/edit/cancel operations require a member account.

Allowed administrator transitions:

```text
PENDING     -> IN_PROGRESS or CANCELLED
IN_PROGRESS -> RESOLVED or CANCELLED
RESOLVED    -> no transitions
CANCELLED   -> no transitions
```

General request PATCH supports a nonempty subset of `title`, `description`, `category`, and `priority`. It cannot change owner/status/dates. Administrator user PATCH accepts only `{name}`; no role escalation or password changes are exposed.

Lists accept page/limit (5, 10, 20). Request lists add title/description search, status/category/priority filters, and newest/oldest order. Metrics are independently aggregated across the user's scope; canceled requests remain in `total` but have no separate dashboard card. Admin `totalUsers` includes all registered accounts.

## API documentation

See [endpoint contract](../docs/api-contract.md) and [OpenAPI 3.0 document](../docs/openapi.json). The JSON file can be imported into Swagger Editor or Postman. Health/readiness endpoints supplement the frontend contract.

## Database adapter requirements for commit 3

Implement `src/repositories/repository.ts` using Prisma, then replace `UnavailableRepository` in `src/server.ts`.

- UUID IDs, unique normalized email, User–ServiceRequest relationship, enum constraints and useful indexes.
- `User.sessionVersion` integer default 0, incremented atomically on logout.
- `createUser` must handle unique-email races as `AppError(409, 'EMAIL_EXISTS', ...)` in addition to the service precheck. Public creation always uses `USER`.
- `createRequest` derives pending status, owner and timestamps on the server.
- `updatePendingRequest` must atomically check both owner and pending status; `transitionRequest` must atomically check the expected current status and optional owner. Return `null` when the conditional write no longer matches. Never implement unchecked read-then-write persistence.
- Return only safe public user fields in relation views and user queries.
- Read list results/counts consistently and use a stable secondary ID order for equal timestamps.
- Scope list/metrics queries by owner before search, filtering, sorting or counting. Admin user counts include all roles.
- Add migrations, controlled admin seeding, safe setup commands and real isolated-database integration tests.

## Verified and pending

- [x] TypeScript production build
- [x] 56 Supertest/Vitest tests across 2 files
- [x] Authentication, authorization, validation, CSRF/origin, rate-limit and request-rule behavior against isolated test repositories
- [x] Installation audit reported zero vulnerabilities
- [x] Source formatting check passed
- [x] Compiled server started; HTTP `/api/health` returned 200 and `/api/ready` returned the expected 503
- [x] OpenAPI JSON parsed; 16 operations and all internal references resolved (full external specification validation not performed)
- [ ] Prisma adapter and database migrations
- [ ] Real-database API tests and concurrency checks
- [ ] Full browser login/request/admin integration

Test-double results verify application behavior; they do not establish database correctness or end-to-end readiness.
