# Interview demonstration (about 5 minutes)

Before presenting, run migrations, seed an administrator with your own chosen credentials, start both servers, and run the documented test/build commands. Keep secrets and the `.env` file out of recordings. Use separate browser profiles or a private window for member/admin sessions.

1. Introduce ServiceNova and the request workflow. Explain React → Express services → Prisma → SQLite.
2. Register a member and show real dashboard counts (initially zero). Create a clear technical request and open its stored detail page.
3. Edit the pending request. Show the category/priority and explain server-derived ownership/status/timestamps.
4. Sign in as an administrator in a separate browser context. Search/filter the request list and move the request to In Progress.
5. Refresh the member page: edit/cancel actions disappear. Explain backend enforcement and the 404 policy for other owners' IDs.
6. Resolve the request as admin. Show the terminal state and updated dashboard metrics.
7. Create a second member request and cancel it; explain that cancellation preserves the row.
8. Search members and update a display name as admin. Explain why public users cannot change roles.
9. Show the mobile navigation, OpenAPI file and test results. Explain atomic conditional writes and isolated test databases.
10. Log out and demonstrate protected-route redirection. Close with honest limitations and possible next improvements.

Recording URL: add the real video link to README.md after recording.
