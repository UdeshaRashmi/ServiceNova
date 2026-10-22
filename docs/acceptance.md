# Verification and submission checklist

## Implemented and verified

- [x] Prisma client generation and TypeScript backend build
- [x] SQLite initialization through checked-in Prisma migrations
- [x] Reapplying migrations without resetting data; database schema up to date
- [x] 56 database-independent API/security tests
- [x] 20 tests using migrated isolated SQLite databases
- [x] Registration, duplicate registration, valid/invalid login and logout revocation
- [x] Authenticated current-user and protected route access
- [x] Public privilege escalation and member/admin endpoint restrictions
- [x] Stored request creation/read/update and persistence across client reconnect
- [x] Owner-only member listing/read/edit/cancel; admin access to all requests
- [x] Pending-only member edits/cancellation; cancellation preserves records
- [x] All allowed status transitions; terminal and invalid transitions rejected
- [x] Request search/filter/sort/pagination and role-scoped dashboard metrics
- [x] Admin user search/detail/name update and safe user projections
- [x] Invalid request input, enum values, IDs and missing fields rejected
- [x] CSRF/origin checks, JSON/body limits, cookie flags, rate limits and safe errors
- [x] Unique-email race handling, conditional status writes and database constraints
- [x] Controlled administrator seed is idempotent and refuses member promotion
- [x] Setup, schema, architecture, API/OpenAPI and limitations documented

## Previous full-stack integration checks (before public Home)

- [x] Frontend production build and 14 frontend tests after integration
- [x] Browser request creation/edit → admin in-progress/resolved lifecycle
- [x] Browser cancellation, search/filter, profile and logout
- [x] Browser admin user search/name update
- [x] Chromium mobile navigation and overflow check (390×844 viewport)
- [x] All four Chromium end-to-end workflows passed in one run
- [x] Compiled server started; health and readiness both returned HTTP 200
- [x] Backend/frontend formatting checks passed
- [x] Backend/frontend dependency audits reported zero vulnerabilities
- [x] Local secrets, database, generated clients, dependencies and test output are ignored by Git
- [x] Prisma migration diff reported no difference between the schema and database
- [x] Desktop/mobile screenshots inspected and saved under docs/screenshots

## Submission tasks

- [ ] Record a demonstration video and add its actual link
- [ ] Review the application on the intended presentation device
- [x] Database/integration change committed (0836479)

## Public Home and dashboard routing

- [x] Public `/` with hero, account links, features, Submit/Track/Resolve workflow, About ServiceNova, and footer
- [x] Protected dashboard moved to `/dashboard`; login defaults and Overview link updated; logo and sidebar Home link return to public Home without logout
- [x] Home remains available when the API is unavailable
- [x] All 16 frontend tests passed and production frontend build passed
- [ ] Updated five-workflow Chromium suite: sandbox test server failed with `uv_os_get_passwd`; permission to rerun outside the sandbox was declined
- [ ] Visual desktop/mobile review of the new Home page

## Sidebar redesign

- [x] Minimal light sidebar with icon-only desktop collapse mode and persisted layout preference
- [x] Member/admin navigation, account controls and Home access
- [x] Mobile drawer Escape handling, background lock and focus restoration
- [x] All 21 frontend tests, production build and formatting check passed
- [ ] Visual browser review of the redesigned sidebar, including collapsed and mobile layouts

No public deployment, Firefox/Safari coverage, load test or complete accessibility audit is claimed. Update this checklist only from executed checks. Browser-test account data is isolated from local development data.

Previous full-stack verification totals: 76 backend tests (including 20 with real SQLite), 14 frontend tests, and 4 browser workflows. Current frontend total: 21 passing tests after adding public Home and the sidebar redesign. One mobile drawer accessibility issue found by earlier browser testing was corrected by hiding the closed offscreen sidebar from visibility/focus.
