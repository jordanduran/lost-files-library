# Accounts and database: free development setup

Use Supabase Free for the database and Google sign-in. A purchased domain, SMTP,
and an email delivery subscription are not required for this login flow. Use
your existing `*.vercel.app` address and localhost. GitHub is also supported as
a selectable provider. Free services have usage limits; this is not a promise
that a production store has no costs.

## 1. Keep your existing Supabase project

If you already ran the migration and seed, do not repeat the migration. It creates
products, licenses, private file references, orders, and order items. The seed
adds 8 demo products and 24 licenses, with no fake purchases or users.

For a new project, run these in SQL Editor, in order:

1. `supabase/migrations/202609120001_accounts_and_catalog.sql` (once).
2. `supabase/seed.sql` (safe to rerun; preserves existing catalog rows).

## 2. Configure Google sign-in

1. In Supabase, open **Authentication → Sign In / Providers → Google**. Copy
   the callback URL shown there: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
2. Open [Google Cloud Console](https://console.cloud.google.com/) and create or
   select a project. You only need OAuth configuration, not paid compute or APIs.
3. Open **Google Auth Platform** and complete the initial configuration. Set
   the app name to **Lost Files Library**, select your support/contact email,
   and choose an **External** audience for personal Google accounts.
4. While the app is in Testing, add your Google email under **Audience → Test users**.
   Add other testers there as needed. Before wider release, review Google's
   publishing requirements for the app's final configuration.
5. Use only the basic identity scopes: `openid`, `userinfo.email`, and
   `userinfo.profile`. No Gmail, Drive, or other data permissions are needed.
6. Under **Clients**, create an OAuth client with type **Web application**.
7. Add these **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://YOUR-APP.vercel.app` (your actual, stable Vercel address)
8. Add the Supabase callback URL from step 1 as the **Authorized redirect URI**.
   This stays the hosted Supabase URL even when the app runs on localhost.
9. Copy the resulting **Client ID** and **Client secret** into Supabase's Google
   provider settings, enable the provider, and save. Keep the secret there;
   do not put it in frontend code or paste it in chat.

Reference: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 3. Configure the return URLs in Supabase

Under **Authentication → URL Configuration**:

- Set **Site URL** to `https://YOUR-APP.vercel.app`.
- Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
- Add `https://YOUR-APP.vercel.app/auth/callback` to **Redirect URLs**.

There are two different callbacks: Google returns to Supabase's `/auth/v1/callback`;
Supabase returns to this app's `/auth/callback`, which creates the cookie session.
Use the exact localhost spelling above when opening the app; changing between
`localhost` and `127.0.0.1` mid-login loses the cookie needed for verification.

## 4. Configure local and Vercel environments

In `.env.local` beside `package.json`, use:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
SITE_URL=http://localhost:3000
AUTH_PROVIDER=google
AUTH_EMAIL_ENABLED=false
```

Get the URL and publishable key from Supabase's Connect panel/API settings.
Do not use a secret or service-role key. Restart `npm run dev` after editing.

In Vercel's project environment variables, add the same settings, but set
`SITE_URL=https://YOUR-APP.vercel.app`. Rebuild/redeploy the updated app after
configuration. Each separate preview deployment needs its own matching site
URL and allowed return URL; use the stable deployment for initial testing.

## 5. Test

Open `http://localhost:3000/login`, click **Continue with Google**, and sign in
with an allowed test account. You should reach an empty **My Library**. Refresh,
open **Account**, sign out, and sign in again. Repeat on the deployed app after
deploying this code and setting its environment variables.

Accounts appear under Supabase **Authentication → Users**. An empty library is
expected because checkout is not implemented yet. A failed library query displays
a retry message instead of pretending there are no purchases.

The code is implemented locally; successful provider login and hosted delivery
must be verified after configuring your real Google and Supabase projects.

After successful login, the header shows an account icon (also visible on mobile)
and a Signed in label on desktop. Open it to see your email, My Library, Account
settings, and Sign out.

If login returns to `/login?error=oauth`, the page now includes a safe error
reference. `auth_service_unreachable` means the local server cannot reach
Supabase. Run it from a normal terminal with outbound HTTPS access; a network-
restricted agent sandbox can display Google login but block the session exchange.
For a missing-cookie reference, start again at the same site address in the same
browser. Callback failures never establish a pretend signed-in state.

## GitHub alternative

Set `AUTH_PROVIDER=github`. In GitHub **Settings → Developer settings → OAuth Apps**,
register an OAuth app with your stable Vercel homepage and the same hosted
Supabase `/auth/v1/callback` URL. Add its Client ID and secret to Supabase's GitHub
provider and enable it. The app return URLs and database stay the same.
[Official instructions](https://supabase.com/docs/guides/auth/social-login/auth-github).

## Adding a domain or email login later

Keep the same Supabase project so user IDs and purchase ownership stay intact.
When adding a domain, update `SITE_URL`, Supabase's allowed return URLs and Site
URL, and the provider's app origins. No database migration is needed just for a
domain change. Existing browser sessions may require signing in on the new domain.

Email-code login remains available behind `AUTH_EMAIL_ENABLED=true`, but only
enable it after configuring SMTP and the **Magic Link** and **Confirm signup**
templates with `{{ .Token }}`. Until then, email login is hidden and its server
action rejects requests. Never disable identity verification to work around SMTP.

## What remains

The storefront still reads the demo catalog in `src/data/mock-beats.ts`. Next:
connect catalog reads, payment checkout and verified webhooks, then private file
delivery. Public synthetic WAV previews work today. Real paid files will live
in object storage, with private references in `product_files`. Browser users
cannot create orders, change prices, or read private storage paths. Admin is
still a protected mock screen requiring trusted `app_metadata.role = admin`.

Supabase's free plan has [usage limits](https://supabase.com/pricing).
Vercel Hobby is for [personal, non-commercial use](https://vercel.com/docs/plans/hobby);
choose hosting that permits commercial use for the store. Payment processing
also has transaction fees when real payments are enabled. No paid services or
new subscriptions were activated by these code changes.

## Checks

`npm run test:auth`, `npm run test:database`, `npm run lint`, `npm run typecheck`,
`npm run build`, and `npm test` cover config validation, SQL/RLS ownership rules,
code checks, browser behavior, and synthetic audio. They do not replace testing
the real provider sign-in after its dashboard configuration is complete.

After building with Supabase connection settings configured, `npm run test:session`
uses an isolated test-process authentication service to verify the complete cookie
round trip, library access, account menu, refresh, and sign-out at desktop/mobile
widths. It never contacts Google or Supabase and does not use real accounts. The
test service is a Node preload used only by `playwright.auth.config.ts`; no test
authentication bypass is imported by application code.
