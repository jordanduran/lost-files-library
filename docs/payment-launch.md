# Payment modes and launch setup

The app defaults to test checkout. No live credentials or environment flags were enabled during implementation. Existing test credentials and the private preview ZIP continue to work after the migration and code are deployed.

## Deploy the support while staying in test mode

1. Run `supabase/migrations/202609140008_payment_modes_and_lifecycle.sql` once in Supabase SQL Editor, after migrations 006 and 007. It adds order payment state and mode-specific functions. Existing orders are preserved, and every product starts with `live_ready=false`.
2. Deploy the matching app code. Keep `CHECKOUT_MODE=test` (the default) and `LIVE_PAYMENTS_ENABLED=false` (also disabled when omitted). Keep the existing `sk_test_` key and test webhook signing secret.
3. In the existing **test** Stripe webhook endpoint, retain its existing events and enable:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - `charge.refunded`, `refund.created`, `refund.updated`, `refund.failed`
   - `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`
4. Test a purchase, refund, and dispute with Stripe test data. Confirm that revoked purchases cannot download from either the library or an emailed link. Already downloaded files cannot be recalled; already issued storage URLs expire within 60 seconds.

## Refund and dispute behavior

Refunds are initiated in Stripe Dashboard, not automatically by the app. Only succeeded refunds revoke access. **Any successful refund, including a partial refund, blocks downloads for the entire order.** This conservative policy requires manual review if only one pack in a multi-pack purchase is refunded. Pending, failed, and canceled refunds do not remove access.

An open or lost dispute blocks downloads. A won dispute restores a previously paid purchase only when no successful refund or manual revocation blocks it. Dispute warnings are treated conservatively as open until closed. Lost disputes remain blocked if later events conflict; exceptional reversals require manual review. Multiple distinct disputes for one order also require review rather than silently restoring access.

The handler verifies the raw Stripe signature with a credential pair for the event's mode. It reads current dispute/refund data and matches the Stripe Checkout Session, PaymentIntent, amount, currency, and order mode. Updates lock the order. Refunded amounts cannot decrease; delayed completion events cannot restore refunded/disputed orders, and duplicate confirmations cannot queue duplicate receipts. Transient Stripe/database/email failures return 500 for retry. Unrelated payments are ignored.

Purchase-email retries select only paid orders. The email queue retains its existing provider idempotency keys and review window. A successful dispute may queue an email for a purchase that was blocked before its initial fulfillment.

## Later: explicitly enable live sales

- Approve the commercial license, selling rights, final artwork, and price.
- Upgrade storage as needed. Create **private** `lost-files-releases`, upload the complete WAV ZIP, and create its matching product/license/file mapping. Do not put full release files in `lost-files-demo`.
- Remove the release's `test_restricted` flag, publish it, and set `live_ready=true` only once its real ZIP and license are ready. The database refuses live checkout for private testers, unapproved products, and products without a live-bucket ZIP mapping.
- Set `STRIPE_LIVE_SECRET_KEY` and `STRIPE_LIVE_WEBHOOK_SECRET` for a separate live webhook endpoint with the same event subscriptions. Retain test credentials as `STRIPE_TEST_SECRET_KEY` and `STRIPE_TEST_WEBHOOK_SECRET` if processing old test events after launch. The old `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` pair remains a mode-checked fallback.
- Set `LIVE_PAYMENTS_ENABLED=true` and `CHECKOUT_MODE=live` together only when launch is approved. A missing or mismatched key leaves checkout unavailable. Do not put secrets or either flag in `NEXT_PUBLIC_` variables.
- Verify a controlled real payment, receipt, full-size download, and refund before announcing the launch. Monitor Stripe webhook failures and the purchase email retry job.

Order storage is immutable by payment mode: test orders use `lost-files-demo`, live orders use `lost-files-releases`, regardless of the current checkout mode. Existing test purchases do not block buying the real release. The test reset maintenance query continues to delete only `is_test=true` orders.

## Verification

- `node scripts/test-pack-database.mjs`: existing guest, tester, OTP, price, and ownership regressions with the new checkout functions.
- `node --experimental-strip-types scripts/test-payment-modes.mjs`: both modes, release readiness, mismatches, refund/dispute ordering, duplicates, access revocation, and the actual event processor against an isolated database and Stripe stub.
- `playwright test --config=playwright.pack.config.ts`: test checkout, protected ZIP/license delivery, retries, and browser verification.
- `playwright test --config=playwright.payment-live.config.ts`: live checkout UI, signed live fulfillment, rejection of mismatched events, and live-bucket delivery using **fake credentials and mocked services only**.

References: [Stripe webhook ordering/retries](https://docs.stripe.com/webhooks), [refund statuses](https://docs.stripe.com/api/refunds/object), [dispute statuses](https://docs.stripe.com/api/disputes/object).
