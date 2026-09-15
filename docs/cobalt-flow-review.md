# Cobalt app flow review — 2026-09-15

Verified the current stacked-window flow at desktop (1440px) and mobile (375px).

- Regular pack: open, close with focus restored, add once, follow toast to cart, refresh cart, continue browsing, reopen an in-cart pack, remove it, and add again.
- Producer archive: vote/unlock persistence, file previews and playback, add to cart, and checkout navigation.
- Signed-in ownership: owned archive offers the library instead of another purchase; private files require the matching paid owner.
- Guest delivery (isolated services): checkout retry and no transient 404, wait for verified payment, ZIP and license downloads, new-browser email-code verification, and recoverable failures.
- Recovery (isolated services): private email links and neutral responses for missing, throttled, and failed lookups.
- Payment lifecycle (local database tests): test/live separation, live release readiness, duplicate fulfillment, refund/dispute ordering, revocation, and server-only permissions.

Fixed the library's Browse Packs / Explore packs links: they now open the available-pack catalog instead of only Allen's archive.

Validation: 7 window/archive browser tests, 2 guest-delivery tests, 4 signed-in ownership tests, 1 recovery browser test, payment lifecycle tests, lint, and production build passed. Added tests/pack-window-flow.spec.ts to preserve the window-to-cart journey.

Limits: payment/email integration checks use isolated test services; no real payment was made. Packs still need their configured files, license, and release readiness before checkout can be enabled. This review does not enable live payments or certify that external services cannot fail.
