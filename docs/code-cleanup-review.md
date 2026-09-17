# Code cleanup review — 2026-09-15

Historical review of the September 15 cobalt/motherboard preview branch, before it was released. For the current theme and routes, see [design previews](design-previews.md).

## Changes

- Removed the unreferenced BeatRow, AddToCart and Waveform components after checking the source import graph and repository references.
- Removed their CSS selectors and unused waveform animation, plus obsolete grid rules and disabled-button styling in the pack inspector.
- Kept styles used by the saved original and file-directory previews; both routes remain covered by browser tests.
- Centralized header-link dismissal through the existing header event handler instead of repeating handlers on individual links.
- Fixed a resize focus race: CSS could hide the mobile navigation and reset browser focus before the desktop media-query callback ran. The callback now remembers the last mobile focus target and transfers focus to desktop navigation.
- Formatted the globe renderer for readability without changing its drawing or interaction logic.
- Separated browser suites requiring mocked services from the default Playwright suite. Added `test:payments:browser` for the isolated live-mode simulation.
- Updated an obsolete intro assertion to respect reduced motion even with a replay URL, and made redirect layout checks wait for the final route/layout.
- Added regression coverage for wide navigation, selected-versus-hover trim, and reduced-motion behavior.

## Verification

- ESLint: passed.
- TypeScript, including `--noUnusedLocals --noUnusedParameters`: passed.
- Next production build: passed.
- Public browser suite: 32 passed; one conditional unconfigured-auth test skipped because auth is configured in this environment.
- Mocked auth/session suite: 4 passed.
- Mocked pack checkout/delivery suite: 2 passed.
- Mocked live-mode payment suite: 1 passed.
- Mocked purchase-recovery suite: 1 passed.
- Resize/focus regression: 3 additional consecutive passes.
- In-process PostgreSQL checks: catalog/RLS, checkout, pack access, payment lifecycle, recovery and test-purchase reset passed.
- Purchase-email escaping/download links and auth-configuration checks: passed.
- Import reachability scan found no remaining unreachable source modules from the app routes/proxy under static imports.

## Repeat the checks

Use Node 22.9+ and the installed Chrome channel for Playwright. Run a production build before the browser suites. Run payment suites sequentially because both use port 3400.

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run test:session
npm run test:packs
npm run test:payments
npm run test:payments:browser
npm run test:recovery
npm run test:database
npm run test:auth
node scripts/test-reset-purchases.mjs
```

Payment, email and storage integration tests use local mocked services; this review did not charge a real card or send customer email. Automated accessibility and import checks are useful evidence, not proof of every browser, assistive-technology or dynamic CSS state. No broad CSS purge or architectural rewrite was performed.
