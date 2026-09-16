# V1 implementation plan

> Historical September 13 plan. Delivery, recovery, payment lifecycle support, and the storefront theme have since been implemented. The September 16 pack-management branch adds the catalog/editor workflow described in [pack management](pack-management.md); it requires the new migrations before deployment. Use [payment launch](payment-launch.md) for the remaining live-sale setup and verification steps.

Reviewed September 13, 2026 against the current source and reported hosted test purchase.

## Implemented

- Google sign-in, sessions, sign-out, account menu, and protected account/library routes.
- Supabase catalog, licenses, private file references, orders, purchase snapshots, and ownership RLS.
- Empty, browser-persisted cart and five-second addition notifications.
- Stripe hosted test Checkout with authoritative database prices and retry idempotency.
- Signed payment-completion webhook and paid-only My Library. User confirmed a test purchase appears on Vercel.
- Synthetic preview audio, playback controls, browsing/filtering, responsive layout, and globe color fallback.
- Production deployment through GitHub main to Vercel.

Apple Pay is enabled in the connected Stripe sandbox and supported by hosted Checkout. A completed Apple Pay transaction has not been independently verified. Live payments are deliberately rejected. Downloads do not exist yet.

## 1. Complete purchased file delivery

Use one private object-storage provider supported by the existing schema. Start with one clearly labeled synthetic demo download and one license before populating all combinations.

- Upload files into a private bucket and record their product/license association in product_files.
- Add an authenticated download endpoint accepting an order-item/file identifier.
- Verify current paid ownership and the exact purchased license on the server for every request.
- Issue a short-lived signed download link; keep keys and storage object paths out of public catalog responses. Disable caching of authorization responses.
- Add file buttons, pending/error states, and missing-file handling to My Library.
- Verify owner success, other-user denial, signed-out denial, refunded/disputed denial, expired links, and correct file content/type/name.

Done when a hosted test buyer can download the correct file again after signing out and back in, and another user cannot access it. Previously issued links may remain valid until their short expiry.

## 2. Make Supabase the storefront source of truth

- Replace mock catalog reads across homepage, beat lists/details, cart, and player metadata.
- Display database license prices before checkout and reconcile changed or unavailable selections.
- Preserve stable product identifiers and historical order snapshots.
- Provide loading, empty, unavailable-product, and database-error states; never silently substitute mock prices.
- Replace outdated checkout/preview copy and update README descriptions of cart persistence.

Done when a published product or price edit appears consistently without changing source code.

## 3. Establish a small catalog publishing workflow

- Initially document product/license creation, preview/artwork uploads, and private file mapping using existing dashboards.
- Check required files and licensing information before publication.
- Use genuine release assets or clearly labeled demo files; do not label WAV fixtures as MP3 or stems.
- Keep the custom admin dashboard out of the release scope until an actual upload workflow is needed.
- Hide unfinished pack purchase/voting actions for v1, or explicitly schedule server-backed packs as a separate feature.

Done when a new beat can be published and purchased without a code change.

## 4. Harden payments before enabling real sales

- Process expired/failed sessions, refunds, and disputes with idempotent state transitions and retry handling.
- Prevent duplicate charges across different pending checkouts for the same license; current request-key deduplication alone does not cover different cart requests.
- Recover expired checkout attempts without requiring users to remove/re-add items.
- Separate sandbox purchases from real entitlements before live mode so test ownership cannot unlock production files or block real purchases.
- Test webhook retries, wrong amounts/users/sessions, and success-page arrival before webhook delivery.
- Add useful server diagnostics without sensitive data and a practical failed-webhook recovery process.

Done when payment state and library/download access stay consistent after retries, failures, refunds, and disputes.

## 5. Prepare and verify launch

- Finalize real license terms and add privacy, terms/refund, and contact pages.
- Review hosting/storage capacity and commercial-use requirements before accepting live payments.
- Rotate credentials that appeared in shared IDE/chat context and update dependent deployments/listeners.
- Verify production OAuth redirects, webhook signing secret, private storage permissions, and backup/recovery setup.
- Explicitly implement and review live-mode configuration; do not merely replace the test Stripe key.
- Run desktop/mobile checkout and download checks, including Apple Pay on an eligible device with the wallet owner.

Defer favorites, reviews, coupons, subscriptions, producer profiles, voting, and advanced analytics until the purchase/download flow is reliable.

Next milestone: sign in → buy one test license → see it in My Library → download the matching private file on Vercel.
