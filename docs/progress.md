# Development checklist

## Commit 1 — frontend

- [x] React/TypeScript/Vite and Tailwind foundation
- [x] ServiceNova branding and bundled Inter typography
- [x] Login and registration forms with client validation
- [x] Cookie-session client and session expiry handling
- [x] Protected member and administrator routes
- [x] Sidebar, mobile navigation, breadcrumbs, account menu, logout action
- [x] Role-aware dashboard consuming API metrics and recent requests
- [x] Request list with search, filters, sorting and pagination
- [x] Request create/edit forms and detail view
- [x] Role/status-based actions and confirmation dialogs
- [x] Administrator user list, details and display-name form
- [x] Profile and 404 page
- [x] Loading, error/retry and empty states
- [x] TypeScript and production build verified (`npm.cmd run build`)
- [x] Automated frontend tests executed successfully (14 tests across 4 files)
- [x] Source formatting check passed (`npm.cmd run format:check`)
- [x] Dependency install audit: zero vulnerabilities; production audit also passed
- [x] Vite dev server started; `/login` returned HTTP 200 with the application entry
- [ ] Manual browser/mobile visual verification

## Commit 2 — backend (pending)

- [ ] Express routes, controllers, reusable services and validation
- [ ] Registration/login/logout/current session
- [ ] Password hashing, secure cookies and CSRF defenses
- [ ] Ownership, administrator authorization and privilege protection
- [ ] Request CRUD and status transition enforcement
- [ ] Search/filter/sort/pagination and aggregate metrics
- [ ] Administrator user management
- [ ] Backend tests with appropriate database-independent coverage

## Commit 3 — database and integration (pending)

- [ ] Prisma user/request schema and indexes
- [ ] SQLite migrations and safe initialization
- [ ] Controlled admin seed and environment examples
- [ ] Frontend → API → database integration
- [ ] API/auth/ownership/status tests against isolated test database
- [ ] OpenAPI and complete setup/architecture documentation
- [ ] Start frontend/backend and verify all acceptance flows
- [ ] Mobile/desktop usability, security and submission checks

No backend/database feature is verified by frontend tests. Automated test fixtures do not provide a runtime preview mode.

Build note: Rollup reports two third-party Zod comment-annotation warnings and removes the annotations; the build exits successfully. No manual browser/device verification was available in this session.
