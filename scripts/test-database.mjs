import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Real PostgreSQL semantics in-process; Supabase's auth schema is stubbed here.
// This verifies SQL and RLS, not the hosted Auth or PostgREST services.
const db = new PGlite();
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202609120001_accounts_and_catalog.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const seed = await readFile(
    new URL("../supabase/seed.sql", import.meta.url),
    "utf8",
  );
  await db.exec(seed);
  await db.exec(seed); // Safe to rerun without duplicating or overwriting catalog.
  const alice = "00000000-0000-0000-0000-000000000001";
  const bob = "00000000-0000-0000-0000-000000000002";
  await db.exec(`
    insert into auth.users values ('${alice}'), ('${bob}');
    insert into public.orders (id, user_id, status, total_cents, paid_at) values
      ('10000000-0000-0000-0000-000000000001', '${alice}', 'paid', 2900, now()),
      ('10000000-0000-0000-0000-000000000002', '${bob}', 'paid', 2900, now()),
      ('10000000-0000-0000-0000-000000000003', '${alice}', 'pending', 2900, null),
      ('10000000-0000-0000-0000-000000000004', '${alice}', 'refunded', 2900, now());
    insert into public.order_items (order_id, product_id, license_id, product_title, license_name, license_terms, file_labels, unit_price_cents)
      select id, 'beat-1', 'mp3', 'Purchased title', 'MP3 License', 'Test terms', array['MP3'], 2900 from public.orders;
    insert into public.product_files (product_id, license_id, storage_provider, bucket, object_key, download_name, content_type, size_bytes)
      values ('beat-1', 'mp3', 'r2', 'private-test', 'never-public.wav', 'test.wav', 'audio/wav', 100);
    update public.products set published = false where id = 'beat-1';
    set role anon;
  `);
  assert.equal(
    (await db.query("select * from public.products")).rows.length,
    7,
  );
  assert.equal(
    (await db.query("select * from public.product_licenses")).rows.length,
    21,
  );
  await assert.rejects(
    db.query("select * from public.orders"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select * from public.product_files"),
    /permission denied/,
  );
  await db.exec(
    `reset role; set role authenticated; set request.jwt.claim.sub = '${alice}';`,
  );
  assert.equal((await db.query("select * from public.orders")).rows.length, 3);
  assert.equal(
    (await db.query("select * from public.order_items")).rows.length,
    3,
  );
  assert.equal(
    (await db.query(`select * from public.orders where user_id = '${bob}'`))
      .rows.length,
    0,
  );
  const library = await db.query(
    "select i.product_title from public.order_items i join public.orders o on o.id = i.order_id where o.status = 'paid'",
  );
  assert.deepEqual(library.rows, [{ product_title: "Purchased title" }]);
  await assert.rejects(
    db.query("select * from public.product_files"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("update public.product_licenses set price_cents = 0"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("update public.orders set status = 'paid', paid_at = now()"),
    /permission denied/,
  );
  await assert.rejects(
    db.query(
      `insert into public.orders(user_id,total_cents) values ('${alice}', 0)`,
    ),
    /permission denied/,
  );
  await assert.rejects(
    db.query("delete from public.order_items"),
    /permission denied/,
  );
  await db.exec(`set request.jwt.claim.sub = '${bob}';`);
  assert.equal((await db.query("select * from public.orders")).rows.length, 1);
  assert.equal(
    (await db.query("select * from public.order_items")).rows.length,
    1,
  );
  await db.exec("set request.jwt.claim.sub = '';");
  assert.equal((await db.query("select * from public.orders")).rows.length, 0);
  console.log(
    "Database checks passed: migration, seed, ownership, private files, write protection, and paid-only library.",
  );
} finally {
  await db.close();
}
