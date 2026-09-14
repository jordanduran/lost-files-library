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
  await db.exec(await readFile(new URL("../supabase/migrations/202609120002_test_checkout.sql", import.meta.url), "utf8"));
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
  const requestId = "20000000-0000-0000-0000-000000000001";
  const cart = JSON.stringify([{ beatId: "beat-2", licenseId: "wav" }]);
  await assert.rejects(db.query("select public.create_test_order($1,$2,$3::jsonb)", [alice, requestId, cart]), /permission denied/);
  await assert.rejects(db.query("select public.confirm_test_order($1,$2,$3,$4,$5)", [requestId, alice, "cs_test_fake", 4900, "usd"]), /permission denied/);
  await db.exec("reset role; set role service_role;");
  await db.exec("reset role; alter table auth.users add column email text default 'listener@example.test';");
  await db.exec(await readFile(new URL("../supabase/migrations/202609130001_purchase_emails.sql", import.meta.url), "utf8"));
  await db.exec("set role authenticated;");
  await assert.rejects(db.query("select * from public.purchase_emails"), /permission denied/);
  await assert.rejects(db.query("select public.claim_purchase_email($1)", [requestId]), /permission denied/);
  await db.exec("reset role; set role service_role;");
  const create = (request = requestId, value = cart) => db.query("select public.create_test_order($1,$2,$3::jsonb) as id", [alice, request, value]);
  const orderId = (await create()).rows[0].id;
  assert.equal((await create()).rows[0].id, orderId, "retry reuses order");
  assert.equal((await db.query("select total_cents from public.orders where id=$1", [orderId])).rows[0].total_cents, 4900);
  await assert.rejects(create(requestId, JSON.stringify([{ beatId: "beat-3", licenseId: "wav" }])), /Cart changed/);
  await assert.rejects(create("20000000-0000-0000-0000-000000000002", JSON.stringify([{ beatId: "beat-1", licenseId: "wav" }])), /Product unavailable/);
  const confirm = (user = alice, amount = 4900, session = "cs_test_example") => db.query("select public.confirm_test_order($1,$2,$3,$4,$5)", [orderId, user, session, amount, "usd"]);
  await assert.rejects(confirm(bob), /does not match/);
  await assert.rejects(confirm(alice, 1), /does not match/);
  await assert.rejects(confirm(alice, 4900, "cs_live_fake"), /does not match/);
  await confirm();
  await confirm();
  assert.equal((await db.query("select * from public.purchase_emails where order_id=$1", [orderId])).rows.length, 1, "Webhook retries queue one email");
  assert.equal((await db.query("select * from public.claim_purchase_email($1)", [orderId])).rows.length, 1);
  assert.equal((await db.query("select * from public.claim_purchase_email($1)", [orderId])).rows.length, 0, "Concurrent attempts cannot claim the same email");
  await db.query("update public.purchase_emails set first_attempt_at=now()-interval '25 hours',claimed_at=now()-interval '3 minutes' where order_id=$1", [orderId]);
  assert.equal((await db.query("select * from public.claim_purchase_email($1)", [orderId])).rows.length, 0);
  assert.equal((await db.query("select status from public.purchase_emails where order_id=$1", [orderId])).rows[0].status, "review", "Do not retry ambiguous delivery beyond provider deduplication window");
  assert.equal((await db.query("select status from public.orders where id=$1", [orderId])).rows[0].status, "paid");
  assert.equal((await db.query("select * from public.order_items where order_id=$1", [orderId])).rows.length, 1);
  await assert.rejects(create("20000000-0000-0000-0000-000000000003"), /Already purchased/);
  await db.query("update public.orders set status='refunded' where id=$1", [orderId]);
  await assert.rejects(confirm(), /cannot be fulfilled/);
  console.log("Checkout checks passed: authoritative prices, idempotency, invalid carts, service-only fulfillment, payment matching, and refund protection.");
  console.log(
    "Database checks passed: migration, seed, ownership, private files, write protection, and paid-only library.",
  );
  await db.exec("reset role");
  await db.exec(await readFile(new URL("../supabase/migrations/202609140001_producer_city_votes.sql", import.meta.url), "utf8"));
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from public.producer_city_votes"), /permission denied/);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [alice]);
  await db.query("insert into public.producer_city_votes values ($1,'TOKYO')",[alice]);
  await assert.rejects(db.query("insert into public.producer_city_votes values ($1,'LONDON')",[bob]),/row-level security/);
  await assert.rejects(db.query("update public.producer_city_votes set city='INVALID' where user_id=$1",[alice]),/check constraint/);
  await db.query("insert into public.producer_city_votes values ($1,'LONDON') on conflict(user_id) do update set city=excluded.city",[alice]);
  assert.equal((await db.query("select * from public.producer_city_votes")).rows.length,1);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [bob]);
  assert.equal((await db.query("select * from public.producer_city_votes")).rows.length,0);
  assert.equal((await db.query("update public.producer_city_votes set city='TOKYO' where user_id=$1 returning *",[alice])).rows.length,0);
  await db.exec("reset role");
  await db.exec(await readFile(new URL("../supabase/migrations/202609140002_remove_city_vote.sql", import.meta.url),"utf8"));
  await db.exec("set role authenticated");
  assert.equal((await db.query("delete from public.producer_city_votes where user_id=$1 returning *",[alice])).rows.length,0);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)",[alice]);
  assert.equal((await db.query("delete from public.producer_city_votes where user_id=$1 returning *",[alice])).rows.length,1);
  assert.equal((await db.query("select * from public.producer_city_votes")).rows.length,0);
  await db.query("insert into public.producer_city_votes values ($1,'LONDON')",[alice]);
  await db.exec("reset role");
  await db.exec(await readFile(new URL("../supabase/migrations/202609140003_city_vote_standings.sql", import.meta.url),"utf8"));
  assert.equal((await db.query("select * from public.producer_city_votes")).rows.length,1,"Existing vote preserved");
  await db.exec("set role authenticated");
  await db.query("insert into public.producer_city_votes values ($1,'TOKYO')",[alice]);
  await assert.rejects(db.query("insert into public.producer_city_votes values ($1,'TOKYO')",[alice]),/duplicate key/);
  await db.query("insert into public.producer_city_votes values ($1,'TOKYO') on conflict(user_id,city) do nothing",[alice]);
  assert.equal((await db.query("select * from public.producer_city_votes")).rows.length,2);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)",[bob]);
  await db.query("insert into public.producer_city_votes values ($1,'TOKYO')",[bob]);
  assert.equal((await db.query("delete from public.producer_city_votes where user_id=$1 returning *",[alice])).rows.length,0);
  await assert.rejects(db.query("update public.producer_city_votes set city='LAGOS'"),/permission denied/);
  await db.exec("set role anon");
  const totals=(await db.query("select * from public.producer_city_standings() order by city")).rows;
  assert.deepEqual(totals.map(r=>[r.city,Number(r.votes)]),[['LONDON',1],['TOKYO',2]]);
  assert.deepEqual(Object.keys(totals[0]).sort(),['city','votes']);
  await assert.rejects(db.query("select * from public.producer_city_votes"),/permission denied/);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)",[alice]);
  await db.query("delete from public.producer_city_votes where user_id=$1 and city='TOKYO'",[alice]);
  assert.deepEqual((await db.query("select city from public.producer_city_votes")).rows,[{city:'LONDON'}]);
  console.log("Per-city votes passed: migration preservation, duplicates, aggregate privacy, and scoped removal.");
  console.log("City vote checks passed: account ownership, one vote, valid cities, and anonymous denial.");
} finally {
  await db.close();
}
