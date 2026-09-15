# V1 accessibility and error handling

Audited September 15, 2026. Live payment settings and purchase permissions were not changed.

## Coverage

- Public home, producer atlas, Allen's archive page, cart, login, guest library, recovery, and unavailable downloads: axe WCAG A/AA scans at 375px and 1440px.
- Signed-in library and account screens: scans against isolated authentication fixtures at both widths.
- Pack dialog: automated scan, keyboard focus containment, Escape dismissal, and focus restoration.
- Private download and email verification screens: automated scans and existing purchase/download/OTP regression tests.
- Keyboard skip link, mobile menu Escape/focus restoration, reduced-motion intro behavior, and keyboard intro dismissal.
- Simulated checkout/download failures, disconnected recovery and verification forms, and server failure followed by successful retry.

## Changes

- Added page and root-layout error boundaries with generic messages, retry options, and page titles. Internal error messages are not rendered.
- Added connection-error feedback to recovery and download verification forms.
- Made the main skip-link target focusable, linked mobile navigation to its toggle, and restored toggle focus on Escape.
- Added focus outlines for summaries and light download/dialog surfaces.
- Kept hidden intro content out of keyboard navigation and prevented scrambled text from being announced. Reduced motion always bypasses the archive animation; Tab or Escape skips the home intro.

## Running checks

Build first, then run `playwright test tests/accessibility.spec.ts`. Use the existing isolated pack and authentication test configurations for private flows; never run those with real payment credentials.

Automated scans do not establish full WCAG compliance. A manual screen-reader pass with VoiceOver/NVDA and real-device browser testing remain release checks. Global root-layout failure recovery has a fallback but was not fault-injected in the browser suite. Hard Drive and internal preview/admin pages are outside this V1 audit.
