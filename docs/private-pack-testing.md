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

Allen's pack is $49 in Stripe test mode, with all 17 original WAVs. Its access terms are labeled **Private Test Access**, with the commercial license pending. No live payment support is enabled by this change.

The local `.tools/enable-ritter-testers.sql` contains the migration, private catalog/file records, and the requested testers. Run it once, in full, only after uploading and checking the complete ZIP in private storage. It checks that the private object exists before enabling checkout. The ZIP is 228,694,850 bytes; the bucket currently has a 5 MiB file limit, which must be raised first within the project's storage limits. Upload and storage-limit changes are awaiting user approval.

Validation: `scripts/test-pack-database.mjs` covers verified/guest/unverified/unauthorized accounts, authoritative mixed-cart prices, idempotent retries, approved email delivery, revocation, catalog privacy, and legacy checkout bypass prevention. Existing mocked browser tests cover guest checkout, delivery verification, and archive previews without real payments or emails.
