import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  for (const migration of ["202609120001_accounts_and_catalog", "202609120002_test_checkout", "202609130001_purchase_emails", "202609140004_pack_guest_checkout"])
    await db.exec(await readFile(new URL(`../supabase/migrations/${migration}.sql`, import.meta.url), "utf8"));
  await db.exec(`insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,published,kind,pack_tracks)
    values('pack','pack','Demo Pack','Demo','Demo',80,'C',10,'paper',true,'pack',array['One','Two']);
    insert into public.product_licenses values('pack','pack','Demo License','Demo terms',array['ZIP','License'],100,'USD');
    insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
      values('pack','pack','supabase','lost-files-demo','demo.zip','demo.zip','application/zip',100);
    set role service_role;`);
  const request = "20000000-0000-0000-0000-000000000001", token = "a".repeat(64);
  const create = (req = request, credential = token) => db.query("select public.create_pack_order(null,$1,$2,'pack') as id", [req, credential]);
  const id = (await create()).rows[0].id;
  assert.equal((await create()).rows[0].id, id);
  await assert.rejects(create(request, "b".repeat(64)), /duplicate key/);
  assert.deepEqual((await db.query("select user_id,total_cents from public.orders where id=$1", [id])).rows[0], { user_id: null, total_cents: 100 });
  const confirm = (amount = 100, session = "cs_test_pack", email = "guest@example.test") => db.query("select public.confirm_pack_order($1,$2,$3,'usd',$4)", [id, session, amount, email]);
  await assert.rejects(confirm(1), /does not match/);
  await assert.rejects(confirm(100,"cs_live_invalid"), /does not match/);
  await assert.rejects(confirm(100,"cs_test_pack",null), /does not match/);
  await confirm(); await confirm();
  await assert.rejects(confirm(100,"cs_test_wrong"), /does not match/);
  assert.deepEqual((await db.query("select recipient from public.purchase_emails where order_id=$1", [id])).rows, [{recipient:"guest@example.test"}]);
  await db.query("update public.product_licenses set description='Changed' where product_id='pack'");
  assert.equal((await db.query("select license_terms from public.order_items where order_id=$1",[id])).rows[0].license_terms,"Demo terms");
  await db.query("update public.orders set status='refunded' where id=$1",[id]);
  await assert.rejects(confirm(), /cannot be fulfilled/);
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.query("select * from public.order_access"), /permission denied/);
  await assert.rejects(create(), /permission denied/);
  await db.exec("set role authenticated");
  await assert.rejects(db.query("select * from public.order_access"), /permission denied/);
  assert.equal((await db.query("select * from public.orders")).rows.length, 0);
  await assert.rejects(confirm(), /permission denied/);
  await db.exec("reset role; update public.products set published=false where id='pack'; set role service_role");
  await assert.rejects(create("20000000-0000-0000-0000-000000000002","b".repeat(64)),/Pack unavailable/);
  console.log("Pack checkout passed: guest ownership, private credentials, price snapshots, retries, payment matching, email recipient, refunds, and unpublished pack denial.");
} finally { await db.close(); }
