# ServiceNova API

Express 5 + TypeScript REST API backed by Prisma ORM 7 and SQLite. Controllers parse input, middleware protects sessions/origins, services enforce authorization/business rules, and the Prisma repository owns database operations.

## Setup and startup

See the root [installation guide](../README.md). From backend/:

```powershell
npm.cmd ci
# Copy .env.example to .env only if .env does not already exist; set JWT_SECRET.
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run dev
```

`db:migrate` applies checked-in migrations without resetting existing records. The database defaults to `prisma/dev.db`. Relative SQLite URLs resolve against backend/ for both the CLI and runtime. Production requires an explicit DATABASE_URL. Startup checks table availability before opening the API listener.

```powershell
npm.cmd run build
npm.cmd start
npm.cmd test
npm.cmd run format:check
npm.cmd audit
```

`build` generates Prisma Client and emits dist/ with test code excluded. Generated client code and database files are ignored. `start` runs compiled JavaScript. Development/start/seed commands load .env through native Node environment-file support. Tests use injected configuration and independent temporary databases.

## Environment and administrator setup

The authoritative examples are [.env.example](.env.example); see the root README for each variable. Set ADMIN_NAME, ADMIN_EMAIL and a unique ADMIN_PASSWORD of 12–128 characters in ignored .env, then run `npm.cmd run db:seed`. Seeding is explicit, idempotent, and refuses to promote existing members. There is no default administrator password.

## Security behavior

- HS256 JWTs use an algorithm allow-list, issuer, audience, expiry and a persistent session version. Every authenticated call reloads the current user/role.
- Logout atomically increments sessionVersion, invalidating all existing sessions for that user, then clears the cookie. Absent/expired sessions may log out idempotently; storage failures remain errors.
- Cookies are HttpOnly, SameSite=Lax, path /. Production uses __Host-servicenova_session with Secure and no Domain; development uses servicenova_session over local HTTP.
- All mutations require a configured exact Origin, including auth endpoints and non-browser API clients. CORS accepts only these origins with credentials. Production requires HTTPS origins.
- Zod rejects unknown body/query fields, invalid UUIDs, enum values, lengths, missing fields and unsupported pagination. POST/PATCH bodies must be JSON (logout may be empty); JSON is limited to 32 KiB.
- Passwords use domain-separated SHA-256 base64 prehashing followed by bcryptjs cost 12, supporting long/Unicode passwords without bcrypt truncation. Administrator seeding uses the same helper.
- User projections omit hashes and session versions, including owner relations. Unexpected errors return safe generic 500 responses; credentials, bodies, database details and stack traces are not printed.
- Helmet, no-store response headers, a 300-request API limit and shared 20-attempt login/registration limit per 15 minutes per IP are included. Rate-limit state is per process.

Proxy headers are not trusted by default. Configure the exact trusted proxy topology for a production deployment and serve the UI/API over HTTPS on compatible origins. Arbitrary cross-site cookie hosting is not supported by this SameSite policy.

## Business and persistence rules

Members see only their own requests. Other owners' IDs return 404; administrator restrictions return 403. Members create PENDING requests and may edit/cancel only while pending. DELETE cancels rather than physically deletes. Admins may transition PENDING to IN_PROGRESS/CANCELLED and IN_PROGRESS to RESOLVED/CANCELLED. Terminal requests accept no changes. Administrator user management accepts display-name changes only.

Prisma queries scope ownership before filtering/counting. List rows/counts and metrics use transactions. Pending edits and status changes match owner/expected status atomically and return a conflict when the row no longer matches. A unique-email constraint catches concurrent registrations. See [database documentation](../docs/database.md) for schema, indexes, migrations, constraints, test isolation and PostgreSQL considerations.

## Endpoints and tests

See [API contract](../docs/api-contract.md), [OpenAPI document](../docs/openapi.json) and [acceptance checklist](../docs/acceptance.md).

`npm.cmd test` runs 57 database-independent API/security/documentation tests and 25 real-database integration tests. Real-database tests create a unique temporary SQLite file, deploy the checked-in migration, and clean up only their own directory. The browser-test server under src/tests/support also uses a separate temporary database and is excluded from production builds.

/api/health reports liveness; /api/ready verifies the database tables and returns 503 when unavailable. The production server uses PrismaRepository. UnavailableRepository is retained only for failure-path tests; MemoryRepository exists only under tests.

## Swagger UI

- Interactive local documentation: `http://localhost:5173/api/docs/` with both servers running.
- Backend documentation: `http://localhost:3000/api/docs/`.
- Raw OpenAPI specification: `http://localhost:3000/api/openapi.json`.

For Try it out, open docs through the frontend proxy so mutations send the trusted frontend Origin. Execute `POST /auth/login` with your own credentials; the browser retains the HttpOnly cookie and authenticated calls use it automatically. Do not paste a JWT into Authorize. Origin inputs cannot override the browser's actual Origin. Access and business rules apply to all requests; Execute can change real database data.

Source: `docs/openapi.json`. `npm.cmd run build` copies this file beside compiled server code in `dist/`; include it when deploying. The docs and static assets work without database readiness, while resource endpoints still require a functioning database. Runtime JavaScript/CSS are served locally. See [Swagger configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) for the cookie and external-validator settings.
