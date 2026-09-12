# Accounts and database setup

## Implemented

- Supabase email-code sign-in and automatic account creation on first sign-in.
- Cookie sessions refreshed by Next.js proxy, server-verified identity, sign-out.
- Protected library/account pages; admin requires trusted `app_metadata.role = admin`.
- PostgreSQL schema for products, licenses, private file references, orders, and order items.
- Row-level security: public published catalog, customers read their own orders,
  no customer writes to commerce tables, and no client access to private file paths.
- Library reads only paid orders, preserving product/license snapshots after unpublishing.
- Synthetic WAV previews with real audio playback.

## Connect a Supabase project

1. Create or choose a development project in Supabase.
2. Copy `.env.example` to `.env.local`. Set the project URL and **publishable** key
   from the project's API settings. No secret/service-role key is needed for this work.
3. In SQL Editor, run `supabase/migrations/202609120001_accounts_and_catalog.sql`
   once, then run `supabase/seed.sql`. The seed inserts demo products, not purchases.
   For later migrations, use the Supabase CLI migration workflow rather than
   re-running the initial migration.
4. Enable email authentication and new-user signups. In Auth email templates,
   set both **Magic Link** and **Confirm signup** to include the numeric token:

   ```html
   <h2>Your Lost Files sign-in code</h2>
   <p>Enter this code in the browser where you requested it:</p>
   <p><strong>{{ .Token }}</strong></p>
   <p>If you didn't request this, you can ignore this email.</p>
   ```

   This app uses codes entered at `/login`, not link callbacks. Keep OTP expiry
   and rate limits configured in Supabase; expired codes require a new request.
5. Configure your SMTP provider for email delivery to customers. The Supabase
   default sender is restricted and is intended for initial testing. Use your
   authorized project/team email for the first hosted test.
6. Restart the dev server. For production, set the same environment variables
   in the hosting project before building and deploying.
7. Open `/login`, request a code, enter it, and confirm you see an empty library.
   Refresh, sign out, and sign in again. A second account must have a separate library.

Missing configuration leaves sign-in disabled with an availability message;
it never fabricates a session or sample purchases. A database query failure
shows a retry message rather than claiming the library is empty.

## Storage and remaining work

Use Supabase PostgreSQL for accounts and purchase metadata, with Cloudflare R2
for private MP3/WAV/stem/ZIP objects. `product_files` stores provider, bucket,
object key, filename, type, and size; only trusted server credentials can read it.
Do not expose those references in public product types or browser state.

This is the accounts/database foundation. The storefront still reads its demo
catalog from `src/data/mock-beats.ts`; `supabase/seed.sql` mirrors that catalog.
Payment checkout, verified payment webhooks, actual purchase creation, secure
download signing, and catalog/admin editing are the next phase. No browser
action creates a paid order. Admin remains a protected mock screen.

Do not make payments live until the mock catalog/licensing text is replaced,
server checkout uses database prices, and private delivery is implemented.
Restrict admin privileges through trusted server-side user management; never
use user-editable metadata for authorization.

## Local verification

```sh
npm run fixtures:audio
npm run fixtures:catalog
npm run test:database
npm run lint
npm run typecheck
npm run build
npm test
```

Database tests run real PostgreSQL SQL/RLS in PGlite, with a minimal stand-in for
Supabase's Auth schema. They verify cross-account isolation, private file access,
write denial, and paid-only library behavior, including unpublished purchases.
They do not verify hosted email delivery, Auth sessions, or PostgREST joins.
Complete the hosted sign-in and two-account checks above after configuration.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
