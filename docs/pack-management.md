# Pack management (v1)

This replaces the sample admin screen with a pack editor. The homepage, pack windows, preview player, cart presentation, and checkout now read the managed catalog. Prices are still verified on the server when checkout starts.

## Install before deploying this branch

Run these SQL files in order in Supabase SQL Editor, after the existing migrations:

1. `supabase/migrations/202609160001_pack_management.sql`
2. `supabase/migrations/202609160002_seed_pack_presentation.sql`
3. `supabase/migrations/202609160003_pack_upload_buckets.sql`

The seed adds presentation metadata only for existing pack IDs. It does not change prices, publication flags, tester permissions, orders, or private file mappings. Missing existing pack records are not created automatically. The public catalog will show only records with managed presentation metadata. Existing additional demo packs use generated artwork until a real cover is uploaded; publishing edits requires a real cover.

The upload migration creates `pack-assets` (public artwork/MP3 excerpts) and `lost-files-releases` (private ZIPs) if absent. It does not change existing bucket settings. Confirm the project storage limit supports the release ZIP size; a bucket limit cannot override the project plan limit. Keep `lost-files-demo` and `lost-files-releases` private. Do not add client write policies to any bucket: admin-checked actions issue unique, non-overwriting signed upload URLs.

Give only the intended operator `app_metadata.role = admin` through the trusted Supabase Auth admin tools. Do not use user-editable `user_metadata` for this. Existing admins keep access. Sign in again, then open **Account → Manage packs**, or `/admin`.

## Daily flow

1. Add a draft. Enter a permanent ID/URL, title, producer, USD price, description, catalog number, and file format.
2. Choose locked or unlocked. Locked means the existing local **Vote to Hack** preview interaction, not a security restriction, community vote tally, free purchase, or release schedule. Private downloads always require a valid purchase. Unlocked packs open previews directly.
3. Upload the cover and optional artist photo. A featured pack needs the artist photo and biography. Artwork and audio excerpts are public; full release files must only go in the private ZIP fields.
4. Add preview tracks with titles, durations, optional BPM/key, and MP3 excerpts. At least two tracks are required to publish, matching the existing pack checkout contract.
5. Enter the license name and complete terms. The existing delivery flow provides a license text download from the order's saved terms; a separate PDF is not required. Upload a test ZIP and, when ready, the real release ZIP.
6. Preview the pack window. The unsaved preview disables adding the pack to the cart.
7. Choose publication status and save. **Draft** hides the pack and disables new purchases. **Public preview / testers** exposes previews but keeps test purchase eligibility restricted to the existing verified tester list. **Published** uses the configured payment mode. **Ready for real sales** additionally requires a real release ZIP and your approval of rights/terms. It does not enable live payment credentials or flags.
8. Feature one pack as the homepage hero. Others appear beneath it, sorted by display order then title.

Prices start at $0.50. This editor does not introduce a free checkout flow. Editing a price or license affects new orders only. Unpublishing leaves existing buyers' files and order snapshots intact. IDs/URLs and saved ZIP references cannot be changed through this editor; use a new pack version for a different ZIP. This deliberately avoids silently replacing files already sold. Orphaned, unfinished uploads can be reviewed manually in Storage; there is no automatic deletion job.

All editor reads, saves, and upload-signing actions verify the server-confirmed admin role. Saves update product, license, and presentation records atomically. Revisions reject concurrent edits instead of silently overwriting them. Featured-pack changes also invalidate the previous featured pack's editor revision.

## Verification

- `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run test:management`: local PostgreSQL permission/transaction tests and isolated browser admin/storefront tests
- `npm test`: public browser regression suite using an isolated catalog fixture
- Existing payment, pack delivery, recovery, and session tests remain separate fixture suites.

No automated test uses real charges, sends real emails, or uploads to hosted storage. After applying the migrations, do one hosted admin save and small upload, check the storefront/cart, and test a full-size release ZIP upload/download before enabling live sales. Keep the live payment flags unchanged during this rollout.
