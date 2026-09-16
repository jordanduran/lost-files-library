import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { validatePack } from "../src/lib/pack-validation.ts";
const db = new PGlite();
const value = {
  id: "managed-pack",
  slug: "managed-pack",
  title: "Managed pack",
  producer: "Producer",
  status: "published",
  liveReady: false,
  featured: true,
  sortOrder: 0,
  price: "29.95",
  priceCents: 2995,
  licenseName: "Pack license",
  licenseTerms: "Test terms",
  revision: 0,
  details: {
    description: "A complete pack",
    artistImage: "/producers/artist.webp",
    artistBio: "Artist bio",
    artistRole: "Producer",
    cover: "/packs/cover.png",
    format: "WAV",
    catalogNumber: "LFL-100",
    locked: true,
    tracks: ["one", "two"].map((id) => ({
      id,
      title: id,
      genre: "WAV audio",
      bpm: null,
      key: null,
      duration: 60,
      previewUrl: "/audio/demo/one.mp3",
    })),
  },
  files: [
    {
      bucket: "lost-files-demo",
      object_key: "uploads/one.zip",
      download_name: "pack.zip",
      size_bytes: 100,
    },
  ],
};
try {
  assert.equal(validatePack(value, "https://storage.example"), null);
  assert.match(
    validatePack({ ...value, price: "0" }, "https://storage.example"),
    /price/,
  );
  assert.match(
    validatePack({ ...value, liveReady: true }, "https://storage.example"),
    /ZIP/,
  );
  assert.match(
    validatePack(
      { ...value, details: { ...value.details, cover: "javascript:alert(1)" } },
      "https://storage.example",
    ),
    /artwork/,
  );
  assert.match(
    validatePack(
      { ...value, details: { ...value.details, tracks: [] } },
      "https://storage.example",
    ),
    /two/,
  );
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
  grant usage on schema public,auth to anon,authenticated,service_role;`);
  for (const name of [
    "202609120001_accounts_and_catalog",
    "202609120002_test_checkout",
    "202609130001_purchase_emails",
    "202609140004_pack_guest_checkout",
    "202609140005_verified_downloads",
    "202609140006_private_pack_testers",
    "202609140007_tester_identity_permissions",
    "202609140008_payment_modes_and_lifecycle",
    "202609160001_pack_management",
    "202609160002_seed_pack_presentation",
  ])
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${name}.sql`, import.meta.url),
        "utf8",
      ),
    );
  const save = (p) =>
    db.query("select public.save_managed_pack($1::jsonb) revision", [
      JSON.stringify(p),
    ]);
  await db.exec("set role anon");
  await assert.rejects(() => save(value), /permission denied/);
  await db.exec("set role authenticated");
  await assert.rejects(() => save(value), /permission denied/);
  await db.exec("set role service_role");
  assert.equal((await save(value)).rows[0].revision, 1);
  await assert.rejects(() => save(value), /changed/);
  const order = (
    await db.query(
      "select public.create_store_order(null,gen_random_uuid(),repeat('a',64),array['managed-pack'],true) id",
    )
  ).rows[0].id;
  await save({
    ...value,
    revision: 1,
    priceCents: 3995,
    licenseTerms: "Changed terms",
    details: { ...value.details, locked: false },
  });
  const snapshot = (
    await db.query(
      "select unit_price_cents,license_terms from public.order_items where order_id=$1",
      [order],
    )
  ).rows[0];
  assert.equal(snapshot.unit_price_cents, 2995);
  assert.equal(snapshot.license_terms, "Test terms");
  await assert.rejects(
    () =>
      save({
        ...value,
        revision: 2,
        files: [{ ...value.files[0], object_key: "replacement.zip" }],
      }),
    /cannot be replaced/,
  );
  assert.equal(
    (
      await db.query(
        "select revision from public.pack_listings where product_id='managed-pack'",
      )
    ).rows[0].revision,
    2,
  );
  await save({ ...value, revision: 2, status: "draft", featured: false });
  assert.equal(
    (
      await db.query(
        "select count(*)::integer n from public.product_files where product_id='managed-pack'",
      )
    ).rows[0].n,
    1,
  );
  await db.exec("set role anon");
  assert.equal(
    (await db.query("select * from public.pack_listings")).rows.length,
    0,
  );
  await assert.rejects(
    () => db.query("select * from public.product_files"),
    /permission denied/,
  );
  await db.exec("set role service_role");
  await save({ ...value, revision: 3 });
  await save({ ...value, id: "second-pack", slug: "second-pack" });
  assert.equal(
    (
      await db.query(
        "select count(*)::integer n from public.pack_listings where featured",
      )
    ).rows[0].n,
    1,
  );
  await assert.rejects(() => save({ ...value, revision: 4 }), /changed/);
  console.log(
    "Pack management: validation, permission denial, atomic saves, conflicts, prices/terms snapshots, immutable ZIPs, draft visibility and featured uniqueness passed.",
  );
} finally {
  await db.close();
}
