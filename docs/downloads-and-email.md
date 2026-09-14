# Pack purchases and delivery

The current storefront uses complete packs, including direct packs and producer archives. Premium Hard Drive entries remain unreleased placeholders.

## Customer flow

1. Open a pack and preview its included sounds. Add the complete pack to the cart.
2. Review packs, prices, included files, and license terms in `/cart`.
3. Continue without an account, or sign in and return to the cart. Stripe collects the delivery email.
4. A verified paid webhook confirms the order and queues one purchase email. The success page waits for that confirmation.
5. The Windows 90s-style email opens a matching private download window. Each purchased pack has a ZIP button and a separate license download. No sign-in is required.
6. Signed-in orders also appear in My Library. Opening a paid order removes only its purchased packs from the current cart.

Guest orders do not create accounts and are not automatically assigned to an account based on an unverified checkout email. Customers must retain their private email link.

## Current rollout state

Code and local tests support Stripe **test mode only**. Live keys are intentionally rejected. Final commercial licenses and real release ZIPs are not supplied by this change. The repository's existing pack prices are retained: Night Shift Drums $29, Chrome Melodies $39, Analog Evidence $24, The Ritter Files Vol. 1 $49. Test fixtures contain original synthetic WAVs, not the advertised production formats or artist recordings.

Before enabling hosted testing:

1. Apply `supabase/migrations/202609140004_pack_guest_checkout.sql` after the earlier migrations. It adds pack metadata, optional account ownership, private download credentials, pack order creation, and guest email fulfillment.
2. Generate synthetic WAV fixtures if needed with `npm run fixtures:audio`. Ensure the private `lost-files-demo` bucket exists (the previous `scripts/setup-demo-downloads.mjs` prepares it).
3. Run `node --experimental-strip-types scripts/setup-demo-pack.mjs`. This creates private demo ZIPs for the three direct packs and the producer pack, plus service-side products, license terms, and prices. Existing records are preserved. Use `--dry-run` to generate local ZIPs under `.tools/demo-packs` without external changes.
4. Configure the existing Stripe test key, webhook secret, Supabase server key, canonical `SITE_URL`, and `DOWNLOAD_BUCKET=lost-files-demo`. Stripe must deliver `checkout.session.completed` (and asynchronous success when applicable) to `/api/stripe/webhook`.
5. For actual inbox delivery, configure `RESEND_API_KEY`, `PURCHASE_EMAIL_FROM`, `PURCHASE_EMAIL_ENABLED=true`, and `EMAIL_JOB_SECRET`. Arbitrary customer addresses require a verified sending domain. An unconfigured sender leaves emails pending while paid downloads remain available on the return page.
6. Verify a hosted test payment, email arrival, and both download buttons before a separate live-payment rollout.

The app disables checkout when catalog records are absent. The server additionally refuses unpublished packs, missing ZIP mappings, duplicate cart entries, invalid prices, and already-owned signed-in packs. Premium placeholders cannot be purchased through this setup. A client-side hack animation does not grant ownership; server publication controls release availability.

## Access and payment safeguards

All totals and license snapshots come from the database. One cart can contain multiple packs. A server-created checkout credential and Stripe idempotency key reuse an unchanged checkout; changing the cart creates a new one. Old individual-beat checkout actions return to the pack cart. Existing paid beat orders and legacy webhooks remain supported.

A random 256-bit bearer token opens a paid order's delivery page. Tokens live in a service-only table, not publicly readable order columns. Token pages are dynamic, non-indexable, private/no-store, and use no-referrer headers. Anyone holding a link can download its files, so users are told to keep it private. Set `order_access.revoked_at` to revoke a guest link. Do not include token paths in analytics or copied logs.

Each file request checks the paid order, exact product and license, private bucket, and test/live asset separation, then issues a 60-second storage link. Licenses use the terms snapshotted at purchase. Orders marked refunded or disputed cannot create new download links; previously issued links expire within 60 seconds. This change does not automate refund/dispute synchronization from Stripe.

## Email delivery and retries

The paid transaction queues the email using the address collected at Stripe checkout. Previous account-only purchases retain their account-email behavior. One email includes all packs in an order and a durable download-window link, never an expiring storage URL.

Resend uses a persisted payload and `purchase/<order-id>` idempotency key. A database lease avoids simultaneous sends. Temporary failures return a retryable webhook error while keeping the paid purchase intact. `POST /api/jobs/purchase-emails` with `Authorization: Bearer <EMAIL_JOB_SECRET>` processes up to five eligible jobs. Schedule that call when enabling delivery. Ambiguous jobs older than 23 hours move to `review`; inspect provider records before manually retrying.

Regenerate the visual preview with `node --experimental-strip-types scripts/preview-purchase-email.mjs`; open `docs/purchase-email-preview.html`.

## Verification

- `npm run test:database`: existing orders, RLS, email queue, and city votes.
- `node scripts/test-pack-database.mjs`: guest and pack order invariants.
- `npm run build` then `npm run test:packs`: signed webhook, guest checkout, and private downloads with mocked services.
- `npm run test:session`: signed-in ownership and authentication regression checks.
- `npm run lint` and `npm run typecheck`.

References: [Stripe checkout return pages](https://docs.stripe.com/payments/checkout/custom-success-page), [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
