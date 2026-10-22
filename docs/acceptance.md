# Verification and submission checklist

Last review: 22 October 2026. This file reports the current verified state; previous test totals are superseded.

## Verification totals

| Check              | Result               | Scope                                                                                                      |
| ------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Backend tests      | 112 passed           | 30 isolated service unit tests, 57 API/security/documentation checks, 25 migrated SQLite integration tests |
| Frontend tests     | 26 passed            | Validation, route access, navigation, chart counts and history states                                      |
| Chromium workflows | 12 passed            | Six full-stack workflows and six accessibility/keyboard scenarios; all passed in one final run             |
| Production builds  | Backend and frontend | TypeScript compilation, Vite output and packaged OpenAPI                                                   |

## Implemented behavior

- [x] Registration, login, HttpOnly cookie sessions and logout session invalidation
- [x] Member ownership checks and admin-only request/user management
- [x] Pending-only member edits/cancellation and backend-enforced status transitions
- [x] Unit coverage of all 16 status pairs, role restrictions, ownership, scoped reads and conditional-write conflicts
- [x] Search, status/category/priority filters, sorting and pagination
- [x] Role-scoped dashboard totals and clickable status chart including cancellations
- [x] Persistent creation/edit/status activity with actor, timestamp and pagination
- [x] Request mutation and activity writes share a transaction; rollback is integration-tested
- [x] Existing requests receive a tracking baseline without invented earlier changes
- [x] SQLite constraints, indexes, conditional writes and safe projections
- [x] Swagger UI at `/api/docs/` and the shared OpenAPI document at `/api/openapi.json`
- [x] Browser Swagger Try it out establishes a cookie session; API origin and role protections remain enforced
- [x] README, schema, API/OpenAPI, demo and accessibility documentation

## Accessibility and responsive review

See [accessibility review](accessibility.md) for scanned states, commands, fixes, evidence and limits.

- [x] Larger text across forms, lists, badges, navigation, profiles and history
- [x] Contrast fixes for secondary text, badges and notifications
- [x] Field errors associated with inputs; named/described confirmation dialogs
- [x] Keyboard-focusable table scrolling; narrow profiles and wrapping pagination/actions
- [x] Mobile drawer Tab containment, Escape and focus return
- [x] Account/Home menu Escape handling and dialog focus containment/return
- [x] Focusable skip-to-content destinations and reduced-motion support
- [ ] Physical-device and assistive-technology review; browser zoom/text scaling
- [ ] Complete WCAG assessment and Firefox/Safari coverage

The test suite scans public, member and administrator pages at 1280 x 900 and 320 x 844 using axe WCAG A/AA tags through 2.2. It also checks page overflow and keyboard interactions. Automated passes do not establish full WCAG conformance; incomplete axe checks require human judgment.

## Browser evidence

The six full-stack workflows cover Swagger, Home/mobile navigation, member/admin request progression with history/chart checks, cancellation/profile/logout, admin display-name management and mobile request navigation. Six additional desktop/mobile scenarios cover accessibility and keyboard behavior.

The [member dashboard](screenshots/member-dashboard.png), [mobile requests](screenshots/mobile-requests.png), [320px form validation](screenshots/request-form-mobile.png) and [320px history/detail](screenshots/request-history-mobile.png) were captured from isolated test accounts and visually inspected. Test-only data never uses or resets the development database.

From `frontend/`:

```powershell
npm.cmd run test:e2e
npm.cmd exec -- playwright show-report
```

Reports and attached axe results are in ignored `frontend/playwright-report/`; diagnostic screenshots/traces are in `frontend/test-results/`. Ports 3010 and 5174 must be free. The restricted execution sandbox may require approval to launch the browser/test servers.

## Submission tasks

- [ ] Confirm repository name `visionroot-software-engineering-assignment` and public evaluator access
- [ ] Record a demo video, add its real Drive URL to README and verify sharing
- [ ] Review the application on the intended presentation device
- [ ] Confirm .env, credentials, databases, dependencies and generated output are excluded from Git
- [ ] Submit source, README, .env.example, migrations/schema, API documentation, tests and required URLs

No public deployment, physical-device coverage, screen-reader certification, load testing or complete accessibility audit is claimed.
