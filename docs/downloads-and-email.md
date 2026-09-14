# Purchased downloads and purchase emails

## What works now

My Library links each purchased item to its download page. A download request verifies the current signed-in account owns a paid order item and that the file matches the exact product/license. Private Supabase Storage links expire after 60 seconds. Refunded/disputed orders cannot request new links; links already issued remain usable until expiry.

The private `lost-files-demo` bucket holds synthetic WAV fixtures for all eight demo beats. Every license currently maps to a clearly labeled demo WAV. These are not real MP3/stem packages and must be replaced before launch. Test orders are limited to this demo bucket. The email links to `/library`, not an expiring file URL: buyers sign in and can download again later.

## Required SQL migration

Run `supabase/migrations/202609130001_purchase_emails.sql` once in the Supabase SQL Editor. Do not rerun the earlier migrations. It adds a private email queue and a trigger that queues an email when an order becomes paid. Existing paid orders are not emailed retroactively.

The queue uses the buyer's account email, not a checkout form address. Customers cannot read or modify it. Purchase confirmation and queue insertion happen together. When sending is disabled, purchases still complete and emails remain pending.

## No domain yet

Downloads work with the current Vercel URL. Email HTML can be previewed now in `docs/purchase-email-preview.html` (regenerate with `node --experimental-strip-types scripts/preview-purchase-email.mjs`). It uses our logo, charcoal background, cream text, gold button, and archive-style labels. The PNG logo is served from `/brand/email-logo.png` for email-client compatibility.

We use Resend's HTTP API for delivery. Its default testing sender can only send to the email associated with your Resend account. Arbitrary customer recipients require verifying a domain you own; you cannot verify `vercel.app` as your email domain. No email plan or domain has been purchased, and no emails have been sent by this implementation run.

Until a verified sender is available, leave `PURCHASE_EMAIL_ENABLED=false` (or unset). The app's Google login and Supabase SMTP settings do not send these purchase emails.

## Enable customer delivery later

1. Create a Resend account and add a domain you own. Add the DNS records Resend provides and wait for verification.
2. Add these server-only variables in local/Vercel configuration:
   - `RESEND_API_KEY`: the provider API key.
   - `PURCHASE_EMAIL_FROM`: `Lost Files Library <downloads@YOUR-VERIFIED-DOMAIN>`.
   - `PURCHASE_EMAIL_ENABLED=true`.
   - `EMAIL_JOB_SECRET`: a long random token for protected queue processing.
   - `SITE_URL=https://lost-files-library.vercel.app` (or the future canonical domain).
   - `DOWNLOAD_BUCKET=lost-files-demo` during sandbox testing.
3. Redeploy. Complete a new test purchase. Confirm the email arrives and its button leads to the buyer's library.
4. Check the queue: `sent` means accepted by Resend, not guaranteed inbox delivery. Inspect delivery/bounce events in Resend when needed.

## Queue retries

Configured emails send immediately after a verified Stripe payment webhook. Temporary send failures return a non-2xx webhook response so Stripe retries; the paid purchase remains available. Persisted message payloads and provider idempotency keys prevent ordinary retries from sending duplicates. A database lease prevents simultaneous sends.

Pending emails from before email configuration, or an interrupted send, can be processed by calling `POST /api/jobs/purchase-emails` with `Authorization: Bearer <EMAIL_JOB_SECRET>`. Each call processes up to five oldest eligible jobs. Keep the token in server configuration, not browser JavaScript. Arrange a scheduled caller when enabling customer email; no recurring scheduler is provisioned automatically here. Repeated calls are safe within the retry window.

After 23 hours from the first attempt, ambiguous jobs move to `review` because Resend retains idempotency keys for 24 hours. Check the provider before manually resolving them; blindly retrying could duplicate an email. Sent jobs are not sent again. Refunded orders are not delivered by the worker.

## Uploading files

To repeat demo setup: `node scripts/setup-demo-downloads.mjs`. It uses the local Supabase server key, refuses a public demo bucket, and preserves existing files/mappings.

For final assets, use a separate private bucket and map exact product/license combinations in `product_files`. Keep the bucket private with no public read policy. A separate live-payment rollout is required: sandbox ownership intentionally cannot download production-bucket assets.

## Validation

Run `npm run test:database` for RLS, paid-order transitions, queue deduplication and claims. Run a production build, then `npm run test:session` for signed-out/other-owner/wrong-file denials and authorized signed-link creation using a mocked storage service. Real hosted purchase and inbox delivery still require the configured services and buyer's session.

Sources: [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [signed downloads](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl), [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
