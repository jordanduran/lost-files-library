import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { recoveryEmail } from "../src/lib/recovery-email-template.ts";
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;`);
  for (const migration of [
    "202609120001_accounts_and_catalog",
    "202609120002_test_checkout",
    "202609130001_purchase_emails",
    "202609140004_pack_guest_checkout",
    "202609140005_verified_downloads",
    "202609140006_private_pack_testers",
    "202609140007_tester_identity_permissions",
    "202609140008_payment_modes_and_lifecycle",
    "202609150001_purchase_recovery",
  ]) {
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${migration}.sql`, import.meta.url),
        "utf8",
      ),
    );
  }
  await db.exec(`insert into products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,kind,pack_tracks) values('pack','pack','Pack','Demo','Demo',80,'C',10,'paper','pack',array['One','Two']);
    insert into product_licenses values('pack','pack','License','Terms',array['ZIP'],100,'USD');`);
  const token = "a".repeat(64);
  for (const [index, status] of [
    "paid",
    "refunded",
    "disputed",
    "pending",
    "paid",
    "paid",
  ].entries()) {
    const id = (
      await db.query(
        `insert into orders(request_id,total_cents,is_test,status,checkout_email,test_product_ids,paid_at) values(gen_random_uuid(),100,true,$1,'Buyer@example.test',$2,now()) returning id`,
        [status, index === 5 ? ["pack"] : []],
      )
    ).rows[0].id;
    await db.query(
      `insert into order_access(order_id,token,request_id,revoked_at) values($1,$2,gen_random_uuid(),$3)`,
      [
        id,
        String.fromCharCode(97 + index).repeat(64),
        index === 4 ? new Date().toISOString() : null,
      ],
    );
    await db.query(
      `insert into order_items(order_id,product_id,license_id,product_title,license_name,license_terms,file_labels,unit_price_cents) values($1,'pack','pack','Pack','License','Terms',array['ZIP'],100)`,
      [id],
    );
  }
  await db.exec("set role service_role");
  const request = (
    email = "buyer@example.test",
    hash = "a".repeat(64),
    ip = "b".repeat(64),
  ) =>
    db.query("select * from request_purchase_recovery($1,$2,$3)", [
      email,
      hash,
      ip,
    ]);
  const result = await request();
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].token, token);
  assert.equal(result.rows[0].recipient, "Buyer@example.test");
  assert.deepEqual(result.rows[0].titles, ["Pack"]);
  assert.equal((await request()).rows.length, 0, "cooldown");
  const expireCooldown = () =>
    db.exec(
      "update purchase_recovery_limits set last_at=now()-interval '61 seconds'",
    );
  await expireCooldown();
  assert.equal((await request()).rows.length, 1);
  await expireCooldown();
  assert.equal((await request()).rows.length, 1);
  await expireCooldown();
  assert.equal((await request()).rows.length, 0, "three per email per hour");
  await db.exec(
    "update purchase_recovery_limits set started_at=now()-interval '61 minutes'",
  );
  assert.equal((await request()).rows.length, 1, "window renews");
  assert.equal(
    (await request("missing@example.test", "c".repeat(64))).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query(
        "select requests from purchase_recovery_limits where key=$1",
        ["email:" + "c".repeat(64)],
      )
    ).rows[0].requests,
    1,
    "unknown emails also counted",
  );
  await db.exec(
    "update purchase_recovery_limits set requests=10 where key like 'ip:%'",
  );
  await expireCooldown();
  assert.equal((await request()).rows.length, 0, "IP limit");
  await db.exec(
    "update purchase_recovery_limits set requests=100 where key='global'",
  );
  assert.equal(
    (await request("buyer@example.test", "d".repeat(64), "e".repeat(64))).rows
      .length,
    0,
    "global limit",
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`reset role;set role ${role}`);
    await assert.rejects(request(), /permission denied/);
    await assert.rejects(
      db.query("select * from purchase_recovery_limits"),
      /permission denied/,
    );
  }
  const mail = recoveryEmail("https://example.test", [
    { token, titles: ["<script>", "Pack & Beat"], is_test: true },
  ]);
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(mail.text.includes(`/downloads/${token}`));
  assert.throws(() =>
    recoveryEmail("https://example.test", [
      { token: "bad", titles: [], is_test: false },
    ]),
  );
  console.log(
    "Recovery passed: paid-only matching, revoked/refunded/disputed/pending/tester denial, cooldown/email/IP/global limits, restricted permissions, and escaped email links.",
  );
} finally {
  await db.close();
}
