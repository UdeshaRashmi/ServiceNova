# Verification and submission checklist

This file records executed checks separately from checks still pending. The latest implementation includes the public Home, responsive sidebar, request history and dashboard status chart.

## Verified implementation

- [x] React/TypeScript frontend and Express/TypeScript backend production builds
- [x] 81 backend tests: 56 API/security tests and 25 migrated SQLite integration tests
- [x] 25 frontend tests covering validation, access, navigation, chart counts and history states
- [x] Registration, login, HttpOnly cookie sessions and logout session invalidation
- [x] Member ownership checks and admin-only request/user management
- [x] Pending-only member edits/cancellation and backend-enforced status transitions
- [x] Search, status/category/priority filters, sorting and pagination
- [x] Role-scoped dashboard totals and clickable status chart, including cancellations
- [x] Persistent activity with actor, time, edited field names and status transitions
- [x] Activity/request writes share a transaction; rollback is integration-tested
- [x] Existing requests receive a tracking baseline without invented earlier events
- [x] SQLite constraints, indexes, conditional updates and safe user projections
- [x] Additive migrations applied after a local backup; development schema up to date
- [x] API health and database readiness returned success after restarting the backend
- [x] README, API reference, OpenAPI and database documentation

## Browser verification and screenshots

On 22 October 2026, all five current Chromium workflows passed in one run (26 seconds). The test server encountered `uv_os_get_passwd` / `ENOMEM` in the sandbox; the subsequent approved run outside the sandbox completed successfully. Tests covered public Home/mobile navigation, the member/admin lifecycle with history and chart assertions, cancellation/profile/logout, admin user management, and mobile request navigation without horizontal overflow.

- [x] Execute all five current Chromium workflows
- [x] Capture and inspect updated desktop/mobile screenshots
- [ ] Review the new Home, sidebar, status chart and request history in a browser
- [ ] Review on the intended presentation device

The [member dashboard](screenshots/member-dashboard.png) and [mobile requests](screenshots/mobile-requests.png) images were regenerated from the successful run and visually inspected. The dashboard shows the current sidebar and status chart using an isolated stored request; the mobile capture shows the request listing empty state at 390 x 844. A full visual review of the remaining Home/history states is still pending.

To regenerate both images, from `frontend/`:

```powershell
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e
```

The lifecycle workflow writes `docs/screenshots/member-dashboard.png`; the mobile workflow writes `docs/screenshots/mobile-requests.png`. Tests use a separate temporary migrated database/API on port 3010 and Vite on port 5174. Do not start another process on those ports. Development accounts and data are not used.

## Submission tasks

- [ ] Confirm the repository name is `visionroot-software-engineering-assignment`
- [ ] Confirm the repository URL is publicly accessible to evaluators
- [ ] Record a demo video and add its actual Drive link to README
- [ ] Include source, README, .env.example, migrations/schema, API docs and automated tests
- [ ] Check that credentials, .env, local databases, dependencies and generated output are excluded from Git
- [ ] Submit the repository and Drive URLs using the assignment instructions

No deployment, physical-device testing, Firefox/Safari coverage, load testing or complete accessibility audit is claimed. Optional features beyond history and the status chart are not required for this checkpoint.
