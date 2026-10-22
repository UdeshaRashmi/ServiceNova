# Accessibility and responsive review

Review date: 22 October 2026. All 12 Chromium scenarios passed in one final run, including six accessibility/keyboard scenarios. The scanned states reported no axe violations under the configured tags. See [acceptance](acceptance.md) for the complete executed totals.

## Scope and repeatable checks

The Playwright suite uses the application against its own migrated temporary SQLite database. It does not modify development accounts. The six accessibility scenarios run in Chromium at **1280 x 900** and **320 x 844**, alongside six existing full-stack workflows (including a 390 x 844 mobile navigation test).

| Area              | States checked                                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public pages      | Home, login, registration and registration errors; mobile navigation open/close                                                                                                               |
| Member workspace  | Dashboard, account menu, request form, validation errors, populated request list, history/detail and profile                                                                                  |
| Administrator     | Dashboard, populated request listing, user listing and user detail/name form                                                                                                                  |
| Keyboard behavior | Skip-to-content, account menu Escape/focus return, mobile drawer Tab containment and Escape/focus return, scrollable table focus, confirmation dialog Tab containment and Escape/focus return |

Axe checks use `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` tags. No application elements or failing rules are excluded. Each scanned state attaches its violations and incomplete results to the Playwright HTML report. Notification transitions settle before contrast measurement. Page-level horizontal overflow is rejected; wide data tables may scroll inside a labelled, keyboard-focusable region.

From `frontend/`:

```powershell
npm.cmd run test:e2e
npm.cmd exec -- playwright show-report
```

Run only the accessibility/keyboard scenarios:

```powershell
npm.cmd run test:e2e -- --grep "accessibility|keyboard access"
```

Reports are generated in ignored `frontend/playwright-report/`; diagnostic screenshots and traces are under ignored `frontend/test-results/`. Dependencies must be installed and Chromium available first, as described in README. Ports 3010 and 5174 must be free.

## Changes made after review

- Increased text sizes across request forms, tables, filters, badges, profiles, sidebar and history; mobile form controls use 16px text and larger interactive targets.
- Darkened secondary text, status badges, Home copy, login footer and notification text after contrast failures.
- Used visible link content for logo/account accessible names; chart counts have accessible descriptions without overriding visible status/percentage labels.
- Associated field errors with their inputs and named confirmation dialogs with their title and explanation.
- Added reliable dialog Tab wrapping and account/Home navigation Escape handling with focus return.
- Preserved the mobile drawer focus trap, background inert state and focus restoration.
- Added keyboard focus to scrolling tables and contained their positioned contents so mobile pages do not overflow.
- Fixed narrow profile layouts, allowed form actions/pagination to wrap, and respected reduced-motion preferences.
- Retained one global skip link and made Home, authentication and workspace main-content targets focusable.

## Inspected screenshots

- [320px form validation](screenshots/request-form-mobile.png): field errors, focus outline, stacked controls and wrapping actions.
- [320px request details/history](screenshots/request-history-mobile.png): long title, request ID, timeline, owner information and actions.
- [Dashboard](screenshots/member-dashboard.png) and [mobile request listing](screenshots/mobile-requests.png).

These use isolated, fictional test accounts. Desktop/mobile snapshots supplement the automated checks; they do not constitute a complete manual audit.

## Limits and manual follow-up

Passing automated checks does not establish full WCAG conformance. Axe can report incomplete checks that need human judgment; those remain available in the report. A screen-reader assessment (NVDA/VoiceOver), physical phone review, Safari/Firefox testing, operating-system text scaling, browser zoom/reflow, and a complete WCAG assessment remain pending. The 320px viewport check is narrow-screen emulation, not proof of behavior on every device or a substitute for a zoom test.

Inspect the intended presentation phone before submission. Check meaningful reading order, form errors, zoom, notification announcements, long request titles/descriptions, the history timeline, horizontal table scrolling and dialog focus. Findings should be recorded here rather than claiming unperformed verification.

Testing follows the [Playwright accessibility guidance](https://playwright.dev/docs/accessibility-testing).
