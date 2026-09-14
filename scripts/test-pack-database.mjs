import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  for (const migration of [
    "202609120001_accounts_and_catalog",
    "202609120002_test_checkout",
    "202609130001_purchase_emails",
    "202609140004_pack_guest_checkout",
    "202609140005_verified_downloads",
    "202609140006_private_pack_testers",
  ])
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${migration}.sql`, import.meta.url),
        "utf8",
      ),
    );
  await db.exec(`insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,published,kind,pack_tracks)
    values('pack','pack','Demo Pack','Demo','Demo',80,'C',10,'paper',true,'pack',array['One','Two']);
    insert into public.product_licenses values('pack','pack','Demo License','Demo terms',array['ZIP','License'],100,'USD');
    insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
      values('pack','pack','supabase','lost-files-demo','demo.zip','demo.zip','application/zip',100);
    set role service_role;`);
  const request = "20000000-0000-0000-0000-000000000001",
    token = "a".repeat(64);
  const create = (req = request, credential = token, packs = ["pack"]) =>
    db.query("select public.create_pack_order(null,$1,$2,$3::text[]) as id", [
      req,
      credential,
      packs,
    ]);
  const id = (await create()).rows[0].id;
  assert.equal((await create()).rows[0].id, id);
  await assert.rejects(create(request, "b".repeat(64)), /duplicate key/);
  await assert.rejects(create(request, token, ["other"]), /Cart changed/);
  await assert.rejects(
    create(request, token, ["pack", "pack"]),
    /Invalid cart/,
  );
  await assert.rejects(create(request, token, []), /Invalid cart/);
  assert.deepEqual(
    (
      await db.query(
        "select user_id,total_cents from public.orders where id=$1",
        [id],
      )
    ).rows[0],
    { user_id: null, total_cents: 100 },
  );
  const confirm = (
    amount = 100,
    session = "cs_test_pack",
    email = "guest@example.test",
  ) =>
    db.query("select public.confirm_pack_order($1,$2,$3,'usd',$4)", [
      id,
      session,
      amount,
      email,
    ]);
  await assert.rejects(confirm(1), /does not match/);
  await assert.rejects(confirm(100, "cs_live_invalid"), /does not match/);
  await assert.rejects(confirm(100, "cs_test_pack", null), /does not match/);
  await confirm();
  await confirm();
  await assert.rejects(confirm(100, "cs_test_wrong"), /does not match/);
  assert.deepEqual(
    (
      await db.query(
        "select recipient from public.purchase_emails where order_id=$1",
        [id],
      )
    ).rows,
    [{ recipient: "guest@example.test" }],
  );
  await db.query(
    "update public.product_licenses set description='Changed' where product_id='pack'",
  );
  assert.equal(
    (
      await db.query(
        "select license_terms from public.order_items where order_id=$1",
        [id],
      )
    ).rows[0].license_terms,
    "Demo terms",
  );
  const browser = "d".repeat(64),
    codeHash = "e".repeat(64),
    challenge = "90000000-0000-0000-0000-000000000001";
  const sendCode = () =>
    db.query("select public.request_download_code($1,$2,$3,$4) as ok", [
      id,
      challenge,
      codeHash,
      browser,
    ]);
  const verifyCode = (hash = codeHash, secret = browser) =>
    db.query("select public.verify_download_code($1,$2,$3) as ok", [
      id,
      hash,
      secret,
    ]);
  assert.equal((await sendCode()).rows[0].ok, true);
  assert.equal(
    (await sendCode()).rows[0].ok,
    false,
    "Resend cooldown enforced",
  );
  assert.equal(
    (await verifyCode(codeHash, "f".repeat(64))).rows[0].ok,
    false,
    "Codes bound to browser",
  );
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal((await verifyCode("f".repeat(64))).rows[0].ok, false);
  assert.equal(
    (await verifyCode()).rows[0].ok,
    false,
    "Five guesses exhaust code",
  );
  await db.query(
    "update public.download_email_codes set last_sent_at=now()-interval '61 seconds' where order_id=$1",
    [id],
  );
  assert.equal((await sendCode()).rows[0].ok, true);
  assert.equal((await verifyCode()).rows[0].ok, true);
  assert.equal((await verifyCode()).rows[0].ok, false, "No code replay");
  assert.equal(
    (
      await db.query(
        "select * from public.download_browser_sessions where order_id=$1 and expires_at>now()",
        [id],
      )
    ).rows.length,
    1,
  );
  await db.query(
    "update public.download_email_codes set consumed=false,expires_at=now()-interval '1 second' where order_id=$1",
    [id],
  );
  assert.equal((await verifyCode()).rows[0].ok, false, "Expired code rejected");
  await db.query(
    "update public.download_email_codes set last_sent_at=now()-interval '61 seconds',send_count=5 where order_id=$1",
    [id],
  );
  assert.equal(
    (await sendCode()).rows[0].ok,
    false,
    "Hourly send cap enforced",
  );
  await db.query(
    "update public.download_email_codes set expires_at=now()+interval '10 minutes',attempts=0 where order_id=$1",
    [id],
  );
  await db.query(
    "update public.order_access set revoked_at=now() where order_id=$1",
    [id],
  );
  assert.equal(
    (await verifyCode()).rows[0].ok,
    false,
    "Revoked access rejected",
  );
  await db.query(
    "update public.order_access set revoked_at=null where order_id=$1",
    [id],
  );
  await db.query("update public.orders set status='refunded' where id=$1", [
    id,
  ]);
  await assert.rejects(confirm(), /cannot be fulfilled/);
  assert.equal((await verifyCode()).rows[0].ok, false, "Refunded order denied");
  await db.exec("reset role; set role anon;");
  await assert.rejects(
    db.query("select * from public.order_access"),
    /permission denied/,
  );
  await assert.rejects(create(), /permission denied/);
  await assert.rejects(sendCode(), /permission denied/);
  await assert.rejects(
    db.query("select * from public.download_email_codes"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select * from public.download_browser_sessions"),
    /permission denied/,
  );
  await db.exec("set role authenticated");
  await assert.rejects(
    db.query("select * from public.order_access"),
    /permission denied/,
  );
  assert.equal((await db.query("select * from public.orders")).rows.length, 0);
  await assert.rejects(confirm(), /permission denied/);
  await db.exec(`reset role;
    insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,published,kind,pack_tracks)
      values('second','second','Second Pack','Demo','Demo',80,'C',10,'paper',true,'pack',array['Three','Four']);
    insert into public.product_licenses values('second','pack','Demo License','Second terms',array['ZIP','License'],250,'USD');
    insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
      values('second','pack','supabase','lost-files-demo','second.zip','second.zip','application/zip',100);
    set role service_role;`);
  const multiRequest = "20000000-0000-0000-0000-000000000003";
  const multi = (await create(multiRequest, "c".repeat(64), ["second", "pack"]))
    .rows[0].id;
  assert.equal(
    (await create(multiRequest, "c".repeat(64), ["pack", "second"])).rows[0].id,
    multi,
  );
  assert.equal(
    (
      await db.query("select total_cents from public.orders where id=$1", [
        multi,
      ])
    ).rows[0].total_cents,
    350,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::integer as count from public.order_items where order_id=$1",
        [multi],
      )
    ).rows[0].count,
    2,
  );
  await db.query(
    "select public.confirm_pack_order($1,'cs_test_multi',350,'usd','multi@example.test')",
    [multi],
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::integer as count from public.purchase_emails where order_id=$1",
        [multi],
      )
    ).rows[0].count,
    1,
  );
  const before = (
    await db.query("select count(*)::integer as count from public.orders")
  ).rows[0].count;
  await assert.rejects(
    create("20000000-0000-0000-0000-000000000004", "d".repeat(64), [
      "pack",
      "unreleased",
    ]),
    /Pack unavailable/,
  );
  assert.equal(
    (await db.query("select count(*)::integer as count from public.orders"))
      .rows[0].count,
    before,
    "Unavailable pack rolls back whole cart",
  );
  await db.exec(
    "reset role; update public.products set published=false where id='pack'; set role service_role",
  );
  await assert.rejects(
    create("20000000-0000-0000-0000-000000000002", "b".repeat(64)),
    /Pack unavailable/,
  );
  await db.exec(`reset role;
    grant select on auth.users to service_role;
    insert into auth.users(id,email,email_confirmed_at) values
      ('10000000-0000-0000-0000-000000000001','tester@example.test',now()),
      ('10000000-0000-0000-0000-000000000002','stranger@example.test',now()),
      ('10000000-0000-0000-0000-000000000003','unverified@example.test',null);
    update public.products set test_restricted=true where id='pack';
    insert into public.pack_testers(product_id,email) values ('pack','tester@example.test'),('pack','unverified@example.test');
    set role service_role;`);
  const tester = "10000000-0000-0000-0000-000000000001";
  const testRequest = "30000000-0000-0000-0000-000000000001";
  const privateOrder = (user, requestId = testRequest) =>
    db.query("select public.create_pack_order($1,$2,$3,$4::text[]) as id", [
      user,
      requestId,
      "9".repeat(64),
      ["pack", "second"],
    ]);
  await assert.rejects(privateOrder(null), /Tester access required/);
  await assert.rejects(
    privateOrder("10000000-0000-0000-0000-000000000002"),
    /Tester access required/,
  );
  await assert.rejects(
    privateOrder("10000000-0000-0000-0000-000000000003"),
    /Tester access required/,
  );
  assert.deepEqual(
    (await db.query("select * from public.tester_pack_ids($1)", [tester])).rows,
    [{ product_id: "pack" }],
  );
  const restrictedId = (await privateOrder(tester)).rows[0].id;
  assert.equal((await privateOrder(tester)).rows[0].id, restrictedId);
  assert.deepEqual(
    (
      await db.query(
        "select test_product_ids,total_cents from public.orders where id=$1",
        [restrictedId],
      )
    ).rows[0],
    { test_product_ids: ["pack"], total_cents: 350 },
  );
  await db.query(
    "select public.confirm_pack_order($1,'cs_test_private',350,'usd','different@example.test')",
    [restrictedId],
  );
  assert.equal(
    (
      await db.query(
        "select recipient from public.purchase_emails where order_id=$1",
        [restrictedId],
      )
    ).rows[0].recipient,
    "tester@example.test",
    "Only the verified tester receives unreleased files",
  );
  assert.equal(
    (
      await db.query("select public.test_order_allowed($1) as ok", [
        restrictedId,
      ])
    ).rows[0].ok,
    true,
  );
  await db.exec(
    "update public.pack_testers set enabled=false where email='tester@example.test'",
  );
  assert.equal(
    (
      await db.query("select public.test_order_allowed($1) as ok", [
        restrictedId,
      ])
    ).rows[0].ok,
    false,
    "Revoking tester access blocks existing downloads",
  );
  await assert.rejects(privateOrder(tester), /Tester access required/);
  await assert.rejects(
    db.query(
      "select public.confirm_pack_order($1,'cs_test_private',350,'usd','tester@example.test')",
      [restrictedId],
    ),
    /Tester access required/,
  );
  await assert.rejects(
    db.exec("update public.products set published=true where id='pack'"),
    /private_test_pack_unpublished/,
  );
  await assert.rejects(
    db.query("select public.create_test_order($1,$2,$3::jsonb)", [
      tester,
      "30000000-0000-0000-0000-000000000002",
      JSON.stringify([{ beatId: "pack", licenseId: "pack" }]),
    ]),
    /Product unavailable/,
    "Legacy checkout cannot bypass tester restrictions",
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`reset role;set role ${role}`);
    await assert.rejects(
      db.query("select * from public.pack_testers"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.tester_pack_ids($1)", [tester]),
      /permission denied/,
    );
    assert.equal(
      (await db.query("select * from public.products where id='pack'")).rows
        .length,
      0,
    );
  }
  console.log(
    "Private testers passed: verified identities, guest/stranger denial, mixed-cart snapshots, approved email delivery, revocation, private catalog, and legacy bypass denial.",
  );
  console.log(
    "Pack checkout passed: guest ownership, private credentials, price snapshots, retries, payment matching, email recipient, refunds, and unpublished pack denial.",
  );
} finally {
  await db.close();
}
