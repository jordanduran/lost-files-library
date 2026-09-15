// Isolated browser-test process only. No real payments, emails, or storage requests.
import "./mock-auth-service.mjs";
import { existsSync, rmSync, writeFileSync } from "node:fs";
rmSync(".tools/mock-download-failure", { force: true });
const original = globalThis.fetch;
const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const testMode = process.env.CHECKOUT_MODE !== "live";
const storageBucket = testMode ? "lost-files-demo" : "lost-files-releases";
const checkoutSessionId = testMode ? "cs_test_guest" : "cs_live_guest";
const orderId = "10000000-0000-0000-0000-000000000001";
const itemId = "30000000-0000-0000-0000-000000000001";
const fileId = "40000000-0000-0000-0000-000000000001";
let token = "a".repeat(64),
  status = "pending",
  session = null;
const sessions = new Map();
let owner = null;
let challenge = null;
const item = {
  id: itemId,
  product_id: "store-pack-001",
  license_id: "pack",
  product_title: "Night Shift Drums",
  license_name: "Demo License",
  license_terms: "Synthetic demo terms",
  unit_price_cents: 100,
};
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  const json = (value) => Response.json(value);
  if (url.origin === "https://api.resend.com") {
    const body = JSON.parse(init.body);
    if (body.to?.[0] !== "guest@example.test")
      throw new Error("Wrong verification recipient");
    const code = body.text.match(/code is (\d{6})/)[1];
    writeFileSync(".tools/mock-download-code.txt", code);
    return json({ id: "mock-email" });
  }
  if (url.origin === "https://api.stripe.com") {
    if (init?.method === "POST") {
      const body = new URLSearchParams(init.body);
      if (
        body.get("line_items[0][price_data][unit_amount]") !== "100" ||
        body.get("metadata[checkout_kind]") !== "pack"
      )
        throw new Error("Invalid Stripe parameters");
      session = checkoutSessionId;
    }
    return json({
      id: checkoutSessionId,
      object: "checkout.session",
      livemode: !testMode,
      status: "open",
      payment_status: "unpaid",
      url: `${process.env.SITE_URL}/checkout/success?session_id=${checkoutSessionId}`,
      metadata: { checkout_kind: "pack", order_id: orderId },
    });
  }
  if (url.origin !== origin) return original(input, init);
  if (
    url.pathname === "/rest/v1/product_files" &&
    existsSync(".tools/mock-download-failure")
  )
    return Response.json(
      { message: "Fixture storage failure" },
      { status: 503 },
    );
  if (url.pathname === `/storage/v1/bucket/${storageBucket}`)
    return json({ public: false });
  if (url.pathname === "/rest/v1/rpc/claim_purchase_email") return json([]);
  if (url.pathname === "/rest/v1/download_browser_sessions") {
    if (init?.method === "POST") {
      const body = JSON.parse(init.body);
      sessions.set(body.secret_hash, body);
      return new Response(null, { status: 201 });
    }
    const key = url.searchParams.get("secret_hash")?.slice(3);
    const record = sessions.get(key);
    return json(
      record && Date.parse(record.expires_at) > Date.now() ? record : null,
    );
  }
  if (url.pathname === "/rest/v1/rpc/request_download_code") {
    const body = JSON.parse(init.body);
    if (challenge && Date.now() - challenge.sent < 60000) return json(false);
    challenge = { ...body, sent: Date.now(), attempts: 0, consumed: false };
    return json(true);
  }
  if (url.pathname === "/rest/v1/download_email_codes")
    return json(challenge ? { challenge_id: challenge.p_challenge } : null);
  if (url.pathname === "/rest/v1/rpc/verify_download_code") {
    const body = JSON.parse(init.body);
    if (
      !challenge ||
      challenge.consumed ||
      challenge.attempts >= 5 ||
      body.p_browser_hash !== challenge.p_browser_hash
    )
      return json(false);
    challenge.attempts++;
    if (body.p_code_hash !== challenge.p_code_hash) return json(false);
    challenge.consumed = true;
    sessions.set(body.p_browser_hash, {
      order_id: orderId,
      expires_at: new Date(Date.now() + 604800000).toISOString(),
    });
    return json(true);
  }
  if (url.pathname === "/rest/v1/order_items" && !url.searchParams.has("id"))
    return json(
      owner && url.searchParams.get("orders.user_id") === `eq.${owner}`
        ? [
            {
              ...item,
              file_labels: ["ZIP", "License"],
              orders: { paid_at: new Date().toISOString() },
            },
          ]
        : [],
    );
  if (url.pathname === "/rest/v1/products")
    return json([
      {
        id: "store-pack-001",
        title: "Night Shift Drums",
        pack_tracks: ["Demo One", "Demo Two"],
        product_licenses: [
          {
            id: "pack",
            name: "Demo License",
            description: "Synthetic demo terms",
            includes: ["ZIP", "License"],
            price_cents: 100,
          },
        ],
      },
    ]);
  if (url.pathname === "/rest/v1/rpc/create_store_order") {
    const body = JSON.parse(init.body);
    if (
      body.p_test !== testMode ||
      body.p_user !== null ||
      body.p_products?.[0] !== "store-pack-001"
    )
      throw new Error("Guest pack order expected");
    token = body.p_token;
    return json(orderId);
  }
  if (url.pathname === "/rest/v1/rpc/confirm_store_order") {
    const body = JSON.parse(init.body);
    if (
      body.p_test !== testMode ||
      body.p_total !== 100 ||
      body.p_email !== "guest@example.test" ||
      body.p_session !== session
    )
      return Response.json({ message: "Mismatch" }, { status: 400 });
    status = "paid";
    return json(null);
  }
  if (url.pathname === "/rest/v1/orders") {
    if (init?.method === "PATCH") {
      const body = JSON.parse(init.body);
      if (body.user_id) owner = body.user_id;
      return new Response(null, { status: 204 });
    }
    if (url.searchParams.get("status") === "eq.paid" && status !== "paid")
      return Response.json({ code: "PGRST116" }, { status: 406 });
    return json({
      id: orderId,
      user_id: owner,
      checkout_email: "guest@example.test",
      status,
      is_test: testMode,
      delivery_bucket: storageBucket,
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      checkout_session_id: session,
      order_items: [item],
    });
  }
  if (url.pathname === "/rest/v1/order_access") {
    if (
      url.searchParams.has("token") &&
      url.searchParams.get("token") !== `eq.${token}`
    )
      return Response.json({ code: "PGRST116" }, { status: 406 });
    return json({ order_id: orderId, token });
  }
  if (
    url.pathname === "/rest/v1/product_files" &&
    url.searchParams.get("product_id") === "eq.store-pack-001"
  ) {
    if (
      url.searchParams.get("license_id") !== "eq.pack" ||
      url.searchParams.get("bucket") !== `eq.${storageBucket}`
    )
      throw new Error("Missing file scope");
    if (!url.searchParams.has("id") && !url.searchParams.has("limit"))
      return json([{ id: fileId, download_name: "Demo.zip" }]);
    return !url.searchParams.has("id") ||
      url.searchParams.get("id") === `eq.${fileId}`
      ? json({
          bucket: storageBucket,
          object_key: "private/demo.zip",
          download_name: "Demo.zip",
        })
      : Response.json({ code: "PGRST116" }, { status: 406 });
  }
  if (
    url.pathname === `/storage/v1/object/sign/${storageBucket}/private/demo.zip`
  ) {
    if (JSON.parse(init.body).expiresIn !== 60) throw new Error("Wrong expiry");
    return json({
      signedURL: `/object/sign/${storageBucket}/private/demo.zip?token=test-only`,
    });
  }
  return original(input, init);
};
