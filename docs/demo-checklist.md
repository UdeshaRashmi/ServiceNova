# ServiceNova demo checklist

Aim for a five-minute recording. Start at the public Home, then demonstrate a request from submission to resolution using separate member/admin browser sessions.

## Preparation

- Follow the installation and environment setup in [README](../README.md).
- From `backend/`, run `npm.cmd run db:migrate` and `npm.cmd run db:status`.
- Seed an administrator with your own credentials using `npm.cmd run db:seed` if needed. Never show .env or credentials in the recording.
- Run one backend (`npm.cmd run dev`) and one frontend (`npm.cmd run dev`) from their respective folders. If the listener reports a port error, stop the duplicate backend before retrying.
- Use a demo member account and fictional request content.
- Keep the latest test results and [OpenAPI](openapi.json) ready to show.

## Recording sequence

1. Introduce ServiceNova on Home: its purpose, features, workflow and About section.
2. Register a member and explain the empty dashboard and real database totals.
3. Submit a technical request with category/priority. Show stored details and the creation entry in Request history.
4. Edit the pending request. Show the history entry naming the changed fields.
5. Open a separate admin session. Search/filter the request list and move the request to In Progress.
6. Refresh the member detail page. Show the status transition, admin actor and timestamp; edit/cancel controls are now unavailable.
7. Resolve the request as admin. Explain that resolved/cancelled states are terminal and enforced by the backend.
8. Return to the dashboard. Show the status chart and click a status to open the filtered list.
9. Create and cancel another pending request; show that cancellation preserves its details/history.
10. Show admin user search and display-name editing. Public registration cannot create admins or change roles.
11. Demonstrate mobile navigation and logo/Home navigation, then log out and show protected-route redirection.
12. Open Swagger at `http://localhost:5173/api/docs/`, expand an endpoint, demonstrate Try it out with cookie login, then show the schema and latest tests. Explain React -> Express -> Prisma -> SQLite and transaction-based history recording.

Mention that existing requests begin with a tracking baseline: earlier changes were not recorded. Be clear about SQLite's local/single-server scope and any browser checks still pending in [acceptance](acceptance.md).

Recording URL: add the actual Drive link to README after recording and verify evaluator access.
