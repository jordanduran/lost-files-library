# Lost Files Library

A music pack storefront built with Next.js App Router, React, TypeScript, Supabase, Stripe, and Resend. Customers can buy packs as guests or with an account, receive a purchase email, and download their ZIP and license. Unreleased test packs require an approved, verified account.

Checkout defaults to test payments. Live payments require explicit configuration and release-ready products; deploying the app does not enable real charges. See [payment launch](docs/payment-launch.md) for activation, storage separation, and refund/dispute behavior. Hard Drive is reserved for V2.

## Development

Use a Node.js version satisfying `package.json` (22.9 or newer).

```sh
npm ci
# Copy .env.example to .env.local and configure the services you need.
npm run dev
```

Open http://localhost:3000. Use the same hostname consistently when testing sign-in so the callback and cookies match. Keep keys and private files out of Git; `.env.local` and `.tools` are ignored.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm run test:database
npm run test:payments
npm run test:packs
npm run test:session
npm test
```

Browser tests use installed Google Chrome. Build before running them, and stop development while building or testing: development and production use the same `.next` output. Tests use dedicated ports and service fixtures where configured. Payment lifecycle tests use a local PostgreSQL engine and mocked Stripe events; they do not make real charges. See [payment launch](docs/payment-launch.md) for the separate mocked live-mode browser check.

## Code organization

- `src/app`: pages, server actions, API routes, and styles.
- `src/components`: storefront, account, download, audio, and shared UI components.
- `src/lib`: server authorization, catalog queries, payments, email delivery, and download access.
- `src/lib/supabase`: shared server and service-role database clients.
- `src/lib/private-download.ts`: shared private-bucket validation and 60-second signed downloads, called after purchase authorization.
- `src/data`: public storefront presentation data and preview fixtures. Checkout prices and availability are verified against Supabase.
- `src/stores`: browser cart and audio state.
- `supabase/migrations`: ordered database changes; preserve applied migrations and add new files for schema changes.
- `supabase/maintenance`: explicitly run maintenance, including test-order reset.
- `tests` and `scripts`: browser regressions, database checks, and fixture tooling.

Legacy beat URLs redirect to the producer storefront. Older purchase callbacks and authenticated download routes remain for existing orders. Some beat components and fixtures are still used by design previews and the audio player.

## Checkout and delivery

The server validates the cart, creates an idempotent order, and opens Stripe Checkout. Verified payment confirmation marks the order paid and queues its email. Downloads check paid status, purchase access, and the order's storage mode before signing a private file URL. New guest browsers may need an email code; an order link alone does not grant download access. Refunds and disputes can block future downloads.

Public preview URLs are separate from private release files. Never expose service credentials or private storage object keys in client data. Test purchases use the test bucket; live purchases require the release bucket. Final files, approved license terms, and store policies are launch prerequisites.

## Setup guides

- [Accounts and database](docs/accounts-and-database.md)
- [Downloads and email](docs/downloads-and-email.md)
- [Private pack testing](docs/private-pack-testing.md)
- [Payment launch](docs/payment-launch.md)
- [First Ritter pack](docs/ritter-files-vol-1.md)
- [Design previews](docs/design-previews.md)
