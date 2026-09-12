# ARCHIVE.

A responsive music storefront built with Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, and Zustand, with a Supabase accounts/database foundation. Brand settings live in `src/lib/config.ts`.

Accounts use email sign-in codes. Follow [accounts and database setup](docs/accounts-and-database.md) to configure Supabase, apply the migration, seed products, and configure email delivery. Without configuration, browsing and synthetic audio previews work, while sign-in is visibly unavailable. Audio files belong in object storage (planned: Cloudflare R2); the database holds only metadata and purchase ownership.

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
npm run test:database
npm test
npm start
```

Browser tests use installed Google Chrome and cover catalog filtering, cart totals, real audio playback and seeking, protected routes, mobile navigation, and layout overflow. Database tests check the SQL migration and purchase access rules in a local PostgreSQL engine. Build first; the browser test runner starts the production server. To test an already running server, set `PLAYWRIGHT_BASE_URL` to its URL. The Geist fonts are fetched by `next/font` at build time and self-hosted at runtime; the first build needs access to Google Fonts.

## Structure

- `src/app`: server route entry points, metadata, global layout and design tokens.
- `src/components`: layout, audio, beat, cart, and shadcn-compatible UI components.
- `src/data/mock-beats.ts`: single public product catalog and license source.
- `src/types`: shared domain types.
- `src/stores`: client player and cart state, retained during client navigation. Reloading resets the demo, including two seeded cart items.

Routes: `/`, `/beats`, `/beats/[slug]`, `/packs`, `/cart`, `/login`, `/account`, `/library`, `/admin`. Artwork is local CSS. Eight original synthetic 16-second WAV fixtures play after the user selects a preview; pause, seek, volume, track changes, and end-of-playback dismissal use a real audio element. Regenerate fixtures with `npm run fixtures:audio` and the matching SQL catalog seed with `npm run fixtures:catalog`.

The library and account require server-verified sign-in. The library reads the current user's paid order items, with empty and retry states. Admin remains a mock screen restricted to trusted admins. Checkout, uploads, and paid downloads are not implemented yet. The catalog/cart still use demo product data and the cart still starts with two sample items.

## Backend integration boundary

The `/packs` page previews “Hack a pack”: one vote animates a locked folder open and reveals purchase/download actions. The unlock is stored locally under `archive-pack-vote-v1`; clear that browser storage entry to replay the locked state. Votes are not shared between visitors. After Hours is an illustrative release, and the buttons explain the pending checkout and download integrations. Before launch, store votes and release thresholds on the server and enforce purchase ownership for downloads.

Do not add private storage object keys or file URLs to the public Beat type. `previewUrl` is reserved for public preview audio only. Replace mock-data reads with server-side catalog queries when Supabase is connected. Keep the current cart as product/license identifiers; server checkout must look up authoritative prices and validate availability, never trust client totals.

Next phase: authenticated user → validated Stripe Checkout session → verified, idempotent Stripe webhook → paid order in Supabase → authenticated library query → server verifies ownership → short-lived signed Cloudflare R2 URL. The accounts, database schema, and library query are implemented; payment processing and private download signing remain. No fake paid orders are seeded. Final license terms must replace illustrative summaries before paid checkout is enabled.

The current in-memory cart still suits the demo. Before checkout, scope cart hydration to the authenticated user and reconcile against database prices. Auth cookies, public catalog data, and private file references remain separate.
