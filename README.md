# ARCHIVE.

A responsive music marketplace frontend built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide, and Zustand. Brand settings live in `src/lib/config.ts`.

## Development

Install Node.js 24 LTS (or a supported Node.js version), then:

```sh
npm install
npm run dev
```

Open http://localhost:3000. In this workspace a portable Node runtime is also available under `.tools`; it is not committed. Add that runtime's folder to your PowerShell PATH if Node is not installed system-wide.

```powershell
$env:Path = "$PWD\.tools\node-v24.21.0-win-x64;$env:Path"
npm.cmd run dev
```

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm start
```

Browser tests use installed Google Chrome and cover catalog filtering, cart totals and deduplication, player state across navigation, placeholder dialogs, mobile navigation, and layout overflow at 375px, 768px, and 1440px. Build first; the test runner starts the production server. To test an already running server, set `PLAYWRIGHT_BASE_URL` to its URL. The Geist fonts are fetched by `next/font` at build time and self-hosted by Next.js at runtime; the first build needs access to Google Fonts.

## Structure

- `src/app`: server route entry points, metadata, global layout and design tokens.
- `src/components`: layout, audio, beat, cart, and shadcn-compatible UI components.
- `src/data/mock-beats.ts`: single public product catalog and license source.
- `src/types`: shared domain types.
- `src/stores`: client player and cart state, retained during client navigation. Reloading resets the demo, including two seeded cart items.

Routes: `/`, `/beats`, `/beats/[slug]` for all eight tracks, `/cart`, `/library`, `/admin`. Artwork is local CSS. No audio files are included: playback state, seek and volume controls are explicitly visual demos. The player is hidden until a preview is selected, advances a visual timer for the listed track duration, and dismisses at the end or when closed. No audio or browser autoplay runs. Catalog search, filters, sorting, license selection, cart deduplication/removal, and dashboard navigation work. Checkout, accounts, uploads and downloads show accessible explanatory dialogs. Admin and library are public mock screens, not protected areas.

## Backend integration boundary

The `/packs` page previews “Hack a pack”: one vote animates a locked folder open and reveals purchase/download actions. The unlock is stored locally under `archive-pack-vote-v1`; clear that browser storage entry to replay the locked state. Votes are not shared between visitors. After Hours is an illustrative release, and the buttons explain the pending checkout and download integrations. Before launch, store votes and release thresholds on the server and enforce purchase ownership for downloads.

Do not add private storage object keys or file URLs to the public Beat type. `previewUrl` is reserved for public preview audio only. Replace mock-data reads with server-side catalog queries when Supabase is connected. Keep the current cart as product/license identifiers; server checkout must look up authoritative prices and validate availability, never trust client totals.

Future flow: authenticated user → validated Stripe Checkout session → verified, idempotent Stripe webhook → order and entitlements in Supabase → authenticated library query → server verifies ownership → short-lived signed Cloudflare R2 URL. Private MP3/WAV/stem objects remain private. No service keys, credentials, authentication claims, payment behavior, order persistence, or download signing are simulated here. Add authentication and role checks before exposing a real admin workspace. Final legal license terms must replace the illustrative package summaries before paid checkout is enabled.

The current in-memory stores suit the demo. Later scope cart hydration and purchase state to the authenticated user, reconcile against server prices, and use a real HTMLAudioElement driven by the player store once preview assets exist.
