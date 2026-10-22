# ServiceNova API contract

These shapes are implemented by Express and the Prisma/SQLite repository, with API tests against real migrated temporary databases. See [backend setup](../backend/README.md), [database design](database.md) and [OpenAPI](openapi.json).

Base URL: `/api`. Requests use JSON and cookie credentials. Successful login and registration must establish the cookie session and return the authenticated user. Public registration must create only `USER` accounts.

All mutations require a trusted `Origin` header. This includes login, registration, logout and non-browser API clients. Logout invalidates all existing sessions for the current user before clearing the cookie. `GET /api/health` reports process liveness; `GET /api/ready` reports database readiness.

## Response shapes

Single resource: `{ "data": { ... } }`.

Lists: `{ "data": [], "pagination": { "page": 1, "limit": 10, "totalItems": 0, "totalPages": 0 } }`.

Error: `{ "error": { "message": "A safe, user-facing message" } }`, with an appropriate HTTP status. Authentication failure is 401; role restrictions are 403. Other users' request IDs should return 404 to avoid revealing existence. No password hashes or internal errors may be returned.

## Endpoints

| Method | Path | Input / response |
| --- | --- | --- |
| POST | `/auth/register` | `{name,email,password}` → user and session |
| POST | `/auth/login` | `{email,password}` → user and session |
| POST | `/auth/logout` | Clear session; 204 or success body |
| GET | `/auth/me` | Current user, or 401 |
| GET | `/requests/metrics` | `{data:{total,pending,inProgress,resolved,totalUsers?}}`; counts scoped by role |
| GET | `/requests` | Paginated requests scoped by role |
| POST | `/requests` | `{title,description,category,priority}` → request |
| GET | `/requests/:id` | Request; authorized owner information |
| GET | `/requests/:id/history` | Owner/admin activity, newest first; `page`, `limit` (5/10/20) |
| PATCH | `/requests/:id` | Member updates own pending request fields |
| DELETE | `/requests/:id` | Cancel own pending request; **no hard deletion** |
| PATCH | `/requests/:id/status` | Administrator `{status}` transition |
| GET | `/users` | Administrator paginated users |
| GET | `/users/:id` | Administrator user detail |
| PATCH | `/users/:id` | Administrator `{name}` update; no role changes |

Register `/requests/metrics` before the parameter route. Metrics must aggregate all role-scoped records, independently of the list page. `totalUsers` is admin-only.

Request list parameters: `search` (title/description), `status`, `category`, `priority`, `sort` (`newest` or `oldest`), `page` (positive integer), `limit` (5, 10 or 20). User list parameters: `search` (name/email), `page`, `limit`.

User: `id`, `name`, `email`, `role`, `createdAt`, optional `updatedAt`, optional `_count: {requests:number}`. Dates use ISO 8601 strings.

Request: `id`, `title`, `description`, `category`, `priority`, `status`, `userId`, `createdAt`, `updatedAt`, optional `user`.

## Validation and business rules

- Name: trimmed 2–100 characters; email must be valid; password 8–128 characters.
- Title: trimmed 5–150 characters; description: trimmed 20–5,000 characters.
- Categories: `TECHNICAL`, `BILLING`, `ACCOUNT`, `OTHER`.
- Priorities: `LOW`, `MEDIUM`, `HIGH`.
- Status: server sets `PENDING` on creation; owner is always the authenticated member.
- Member: view own requests; edit/cancel only while pending; no arbitrary status updates.
- Admin: view all requests; transition `PENDING → IN_PROGRESS/CANCELLED`, `IN_PROGRESS → RESOLVED/CANCELLED`.
- `RESOLVED` and `CANCELLED` are terminal.
- Profile is read-only. Admin member management permits display-name updates only.

Production cookies must be HttpOnly, Secure and use an appropriate SameSite policy. The backend must verify request origins or use CSRF tokens for mutations. Cookies are authoritative; frontend state is not an authorization boundary.

History returns the standard paginated envelope. Each event contains `id`, `requestId`, `actorId`, `actor: {id,name} | null`, `type`, `fromStatus`, `toStatus`, `changedFields`, and `createdAt`. Types: CREATED, UPDATED, STATUS_CHANGED, TRACKING_STARTED. Updates record changed field names, without storing prior text. No-op edits and rejected actions create no events. Existing requests get a migration-time TRACKING_STARTED baseline; earlier changes cannot be reconstructed. Creation, edits and transitions commit together with their event.
