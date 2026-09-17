# Current theme and saved previews

The current app uses midnight navy-to-black surfaces, electric blue (`#247dff`), dark glass windows, and a motherboard pointer reveal. Shared tokens and window styles live in `src/app/modern-windows.css`; surface refinements live in `src/app/refined-archive.css`. Tokens also apply to body-mounted dialogs and notifications. Pale blue text supports contrast; green is reserved for the intentional unlock check, and red for errors and close feedback.

The homepage features a producer archive with shallow stacked windows. Opening it shows the producer bio and packs; locked packs can be voted on within that window. Archive/pack unlocks are browser-local demos, not purchase entitlements. The testing reset clears demo unlocks only.

`/producers` is the searchable directory, `/discover` contains the globe and account-backed city votes, and `/packs` is the complete pack catalog. Pack cards reflect demo unlocks and purchase ownership.

Purchase emails retain the centered white logo seal, with near-black background (`#010407`), dark panels (`#07111b`), and electric-blue buttons. Recovery and code emails use the same palette. See `docs/purchase-email-preview.html`. Previously queued or sent email payloads retain their original appearance.

Saved previews remain at `/preview/original` and `/preview/file-directory`. The original Git tag is `design/archive-before-file-directory-20260914`. Historical preview CSS and fixtures are retained for those routes; do not remove them solely because their colors differ from the current theme.

My Library uses a compact purchase browser with artwork cards, search by title/producer, recent/name sorting, and grid/list views. Cards open the existing protected download route. Artwork is optional; the shared PackArt component uses uploaded covers or the existing per-pack CSS designs without hiding purchases. Library navigation stays in the main site header, with a recovery link below the cards. No per-sound categories or favorites are implied by this layout.

Run locally with `npm run dev`. Check `tests/midnight-theme.spec.ts`, `tests/theme.spec.ts`, and `tests/pack-window-flow.spec.ts` for palette, layout, and purchase-navigation regressions. Reduced motion disables decorative animation.
