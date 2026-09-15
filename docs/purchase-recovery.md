# Purchase recovery

`/recover` is linked from sign-in and the footer. Guests enter their checkout email; one email contains their 50 most recent available order links. It does not create an account, claim orders, rotate tokens, or grant browser access. Existing owner/email-code verification still applies to downloads.

Apply `supabase/migrations/202609150001_purchase_recovery.sql` after the existing payment migrations before deploying. Existing Resend and Supabase settings are reused. Optionally set `SUPPORT_EMAIL` to the customer support inbox; an empty value hides the contact link.

Only paid orders with non-revoked links and current tester eligibility are included. Refunded, disputed, pending, and revoked purchases are excluded. Legacy beat orders without a guest access token remain available through the account library.

The database atomically limits recovery requests to three per email per hour, one per minute, ten per IP per hour, and 100 globally per hour. Unknown emails consume the same limits. Limiter keys are HMAC hashes using the existing server key; old records are removed on subsequent requests after a day. Rotating the server key resets email/IP buckets. Vercel's `x-vercel-forwarded-for` is used only on Vercel; local requests share one bucket. See [Vercel request headers](https://vercel.com/docs/headers/request-headers).

Valid requests receive the same neutral response before lookup and sending via Next.js `after`. No purchase titles, recipients, or tokens are returned to the browser. Sender/database failures produce a generic server log without customer data; the customer can request again after the cooldown. This simple flow does not add automatic recovery-email retries or alter the original receipt queue.

Verification:

```sh
npm run test:recovery
```

Build first and stop development while running production browser tests. The tests use local PostgreSQL and isolated mock email/auth services, never real customer inboxes.
