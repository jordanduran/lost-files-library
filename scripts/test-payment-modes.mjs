import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import {
  paymentMode,
  paymentCredentials,
  orderBucket,
} from "../src/lib/payment-config.ts";
import { processPaymentEvent } from "../src/lib/payment-events.ts";

const env = {
  STRIPE_SECRET_KEY: "sk_test_fixture",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
};
assert.equal(paymentMode(env), "test");
assert.equal(paymentCredentials(true, env).key, "sk_test_fixture");
assert.equal(paymentCredentials(false, env), null);
assert.equal(paymentMode({ ...env, CHECKOUT_MODE: "typo" }), null);
assert.equal(
  paymentCredentials(false, {
    ...env,
    STRIPE_LIVE_SECRET_KEY: "sk_live_fixture",
    STRIPE_LIVE_WEBHOOK_SECRET: "whsec_live",
  }),
  null,
);
assert.equal(
  paymentCredentials(false, { ...env, LIVE_PAYMENTS_ENABLED: "true" }),
  null,
);
assert.equal(
  paymentCredentials(false, {
    ...env,
    LIVE_PAYMENTS_ENABLED: "true",
    STRIPE_LIVE_SECRET_KEY: "sk_live_fixture",
    STRIPE_LIVE_WEBHOOK_SECRET: "whsec_live",
  }).key,
  "sk_live_fixture",
);
assert.equal(orderBucket(true), "lost-files-demo");
assert.equal(orderBucket(false), "lost-files-releases");
const db = new PGlite();
try {
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
  ])
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/" + name + ".sql", import.meta.url),
        "utf8",
      ),
    );
  await db.exec(`insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,published,kind,pack_tracks,live_ready)
 values('release','release','Release','Artist','Mixed',null,'Mixed',100,'paper',true,'pack',array['One','Two'],false);
 insert into public.product_licenses values('release','pack','License','Approved terms',array['ZIP'],4900,'USD');
 insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
 values('release','pack','supabase','lost-files-demo','test.zip','test.zip','application/zip',100);
 set role service_role;`);
  const create = (
    test,
    req = randomUUID(),
    token = randomBytes(32).toString("hex"),
  ) =>
    db.query(
      "select public.create_store_order(null,$1,$2,$3::text[],$4) as id",
      [req, token, ["release"], test],
    );
  await assert.rejects(
    create(false),
    /Pack unavailable/,
    "Live releases require explicit approval",
  );
  await db.exec(
    "update public.products set live_ready=true where id='release'",
  );
  await assert.rejects(
    create(false),
    /Pack unavailable/,
    "A test ZIP cannot satisfy a live order",
  );
  await db.exec(`insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
 values('release','pack','supabase','lost-files-releases','release.zip','release.zip','application/zip',1000);`);
  const live = (await create(false)).rows[0].id,
    test = (await create(true)).rows[0].id;
  assert.equal(
    (
      await db.query("select delivery_bucket from public.orders where id=$1", [
        live,
      ])
    ).rows[0].delivery_bucket,
    "lost-files-releases",
  );
  assert.equal(
    (
      await db.query("select delivery_bucket from public.orders where id=$1", [
        test,
      ])
    ).rows[0].delivery_bucket,
    "lost-files-demo",
  );
  const confirm = (id, mode, session, intent) =>
    db.query(
      "select public.confirm_store_order($1,$2,4900,'usd','buyer@example.test',$3,$4)",
      [id, session, mode, intent],
    );
  await assert.rejects(
    confirm(live, true, "cs_test_wrong", "pi_wrong"),
    /does not match/,
  );
  await assert.rejects(
    confirm(test, false, "cs_live_wrong", "pi_wrong"),
    /does not match/,
  );
  await assert.rejects(
    confirm(live, false, "cs_live_order", null),
    /does not match/,
  );
  await confirm(live, false, "cs_live_order", "pi_live");
  await confirm(live, false, "cs_live_order", "pi_live");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.purchase_emails where order_id=$1",
        [live],
      )
    ).rows[0].n,
    1,
  );
  const state = async (id) =>
    (
      await db.query(
        "select status,refunded_cents,dispute_status from public.orders where id=$1",
        [id],
      )
    ).rows[0];
  const update = (
    id,
    session,
    intent,
    test,
    refund = 0,
    dispute = null,
    status = null,
  ) =>
    db.query(
      "select public.apply_order_payment_event($1,$2,$3,$4,4900,'usd',$5,$6,$7)",
      [id, session, intent, test, refund, dispute, status],
    );
  await update(live, "cs_live_order", "pi_live", false, 0, "du_live", "open");
  assert.equal((await state(live)).status, "disputed");
  await confirm(live, false, "cs_live_order", "pi_live");
  assert.equal((await state(live)).status, "disputed");
  await db.query(
    "update public.order_access set revoked_at=now() where order_id=$1",
    [live],
  );
  await update(live, "cs_live_order", "pi_live", false, 0, "du_live", "won");
  assert.equal((await state(live)).status, "paid");
  assert.ok(
    (
      await db.query(
        "select revoked_at from public.order_access where order_id=$1",
        [live],
      )
    ).rows[0].revoked_at,
    "Winning does not clear manual revocation",
  );
  await update(live, "cs_live_order", "pi_live", false, 0, "du_live", "open");
  assert.equal(
    (await state(live)).status,
    "paid",
    "Old dispute events do not reopen a closed dispute",
  );
  await update(live, "cs_live_order", "pi_live", false, 100);
  assert.equal(
    (await state(live)).status,
    "refunded",
    "Partial refund blocks access",
  );
  await update(live, "cs_live_order", "pi_live", false, 0, "du_live", "won");
  assert.equal((await state(live)).refunded_cents, 100);
  await confirm(live, false, "cs_live_order", "pi_live");
  assert.equal((await state(live)).status, "refunded");
  await assert.rejects(
    update(live, "cs_test_wrong", "pi_live", true, 100),
    /does not match/,
  );
  await assert.rejects(
    update(live, "cs_live_order", "pi_other", false, 100),
    /does not match/,
  );
  // Refund before payment confirmation: no email and no download access.
  await update(test, "cs_test_early", "pi_early", true, 4900);
  await confirm(test, true, "cs_test_early", "pi_early");
  assert.equal((await state(test)).status, "refunded");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.purchase_emails where order_id=$1",
        [test],
      )
    ).rows[0].n,
    0,
  );
  const early = (await create(true)).rows[0].id;
  await update(
    early,
    "cs_test_dispute",
    "pi_dispute",
    true,
    0,
    "du_early",
    "open",
  );
  await update(
    early,
    "cs_test_dispute",
    "pi_dispute",
    true,
    0,
    "du_early",
    "won",
  );
  await confirm(early, true, "cs_test_dispute", "pi_dispute");
  assert.equal((await state(early)).status, "paid");
  const lost = (await create(true)).rows[0].id;
  await update(lost, "cs_test_lost", "pi_lost", true, 0, "du_lost", "lost");
  await confirm(lost, true, "cs_test_lost", "pi_lost");
  assert.equal((await state(lost)).status, "disputed");
  // Exercise the actual event processor against SQL with an isolated Stripe stub.
  const eventOrder = (await create(true)).rows[0].id;
  const checkout = {
    id: "cs_test_events",
    livemode: false,
    metadata: { order_id: eventOrder, checkout_kind: "pack" },
    payment_intent: "pi_events",
    amount_total: 4900,
    currency: "usd",
    payment_status: "paid",
    customer_details: { email: "buyer@example.test" },
  };
  let refunds = [{ status: "pending", amount: 100 }];
  let disputeStatus = "needs_response";
  const stripe = {
    checkout: { sessions: { list: async () => ({ data: [checkout] }) } },
    charges: {
      retrieve: async () => ({
        id: "ch_events",
        livemode: false,
        payment_intent: "pi_events",
        amount: 4900,
        currency: "usd",
      }),
    },
    disputes: {
      retrieve: async () => ({
        id: "du_events",
        livemode: false,
        charge: "ch_events",
        status: disputeStatus,
      }),
    },
    refunds: {
      list: () => ({
        async *[Symbol.asyncIterator]() {
          for (const r of refunds) yield r;
        },
      }),
    },
  };
  const rpc = {
    rpc: async (name, args) => {
      try {
        await db.query(
          `select public.${name}(${Object.keys(args)
            .map((_, i) => "$" + (i + 1))
            .join(",")})`,
          Object.values(args),
        );
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
  };
  const event = (type, object) => ({ type, livemode: false, data: { object } });
  await processPaymentEvent(
    event("checkout.session.completed", checkout),
    stripe,
    rpc,
  );
  await processPaymentEvent(
    event("refund.updated", { charge: "ch_events" }),
    stripe,
    rpc,
  );
  assert.equal(
    (await state(eventOrder)).status,
    "paid",
    "Pending refunds do not block",
  );
  await processPaymentEvent(
    event("charge.dispute.created", { id: "du_events" }),
    stripe,
    rpc,
  );
  assert.equal((await state(eventOrder)).status, "disputed");
  disputeStatus = "won";
  await processPaymentEvent(
    event("charge.dispute.closed", { id: "du_events" }),
    stripe,
    rpc,
  );
  assert.equal((await state(eventOrder)).status, "paid");
  refunds = [
    { status: "failed", amount: 100 },
    { status: "succeeded", amount: 200 },
  ];
  await processPaymentEvent(
    event("charge.refunded", { id: "ch_events" }),
    stripe,
    rpc,
  );
  assert.equal((await state(eventOrder)).refunded_cents, 200);
  await processPaymentEvent(
    event("checkout.session.completed", checkout),
    stripe,
    rpc,
  );
  assert.equal((await state(eventOrder)).status, "refunded");
  await assert.rejects(
    processPaymentEvent(
      { ...event("checkout.session.completed", checkout), livemode: true },
      stripe,
      rpc,
    ),
    /mode mismatch/,
  );
  await assert.rejects(
    processPaymentEvent(event("charge.refunded", { id: "ch_events" }), stripe, {
      rpc: async () => ({ error: { message: "offline" } }),
    }),
    /update failed/,
  );
  await db.exec("reset role");
  const realBefore = (
    await db.query(
      "select count(*)::int as n from public.orders where not is_test",
    )
  ).rows[0].n;
  await db.exec(
    await readFile(
      new URL(
        "../supabase/maintenance/reset_test_purchases.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.orders where not is_test",
      )
    ).rows[0].n,
    realBefore,
    "Test reset preserves live orders",
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from public.orders where is_test",
      )
    ).rows[0].n,
    0,
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec("reset role;set role " + role);
    await assert.rejects(create(false), /permission denied/);
    await assert.rejects(
      confirm(live, false, "cs_live_order", "pi_live"),
      /permission denied/,
    );
    await assert.rejects(
      update(live, "cs_live_order", "pi_live", false),
      /permission denied/,
    );
  }
  console.log(
    "Payment modes/lifecycle passed: live opt-in, release readiness, storage separation, mode mismatch, refund/dispute ordering, duplicate fulfillment, manual revocation, pending refunds, retries, and server-only access.",
  );
} finally {
  await db.close();
}
