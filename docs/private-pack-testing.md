# Private pack testing

Migration `202609140006_private_pack_testers.sql` adds a per-pack email allowlist. Apply it before deploying the corresponding checkout code. Existing public demo packs keep guest checkout.

Private test packs use `test_restricted=true` and `published=false`. The database rejects publishing a restricted pack. Only an enabled tester signed into an account with a verified matching email can create its order. Prices and file mappings remain server controlled. Private test orders record their restricted product IDs; disabling an allowlist entry also blocks their delivery routes. Pack emails go to the verified account address, not an alternate address entered at Stripe checkout.

Add testers in Supabase SQL Editor after creating the private product:

```sql
insert into public.pack_testers(product_id,email)
values ('ritter-files-vol-1','tester@example.com')
on conflict(product_id,email) do update set enabled=true;
```

Use lowercase email addresses. The table and helper functions are accessible only to the service role. Actual tester addresses and private storage mappings belong in local setup files, not Git. Set `enabled=false` to remove access. Already downloaded files cannot be recalled, and an issued storage URL remains valid for up to 60 seconds.

Allen's pack is $49 in Stripe test mode. Until the storage upgrade, its test ZIP contains all 17 short MP3 previews and a test-only README, not the original WAVs. Its access terms are labeled **Private Test Access**, with the commercial license pending. No live payment support is enabled by this change.

The local `.tools/enable-ritter-testers.sql` contains the migration, private catalog/file records, and the requested testers. Run it once, in full, after uploading and checking the test ZIP in private storage. It checks that the private object exists before enabling checkout. The uploaded preview test ZIP is 4,064,516 bytes and fits the unchanged private bucket limit of 5 MiB. The original 228,694,850-byte WAV ZIP remains local. Its upload was approved but deferred because the project global limit requires a paid plan. Before launch, upload the originals, replace the test file mapping and terms, and validate a complete full-size download.

Validation: `scripts/test-pack-database.mjs` covers verified/guest/unverified/unauthorized accounts, authoritative mixed-cart prices, idempotent retries, approved email delivery, revocation, catalog privacy, and legacy checkout bypass prevention. Existing mocked browser tests cover guest checkout, delivery verification, and archive previews without real payments or emails.
