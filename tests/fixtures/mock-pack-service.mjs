// Isolated browser-test process only. No real payments, emails, or storage requests.
import "./mock-auth-service.mjs";
const original = globalThis.fetch;
const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const orderId = "10000000-0000-0000-0000-000000000001";
const itemId = "30000000-0000-0000-0000-000000000001";
const fileId = "40000000-0000-0000-0000-000000000001";
let token = "a".repeat(64),
  status = "pending",
  session = null;
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
  if (url.origin === "https://api.stripe.com") {
    if (init?.method === "POST") {
      const body = new URLSearchParams(init.body);
      if (
        body.get("line_items[0][price_data][unit_amount]") !== "100" ||
        body.get("metadata[checkout_kind]") !== "pack"
      )
        throw new Error("Invalid Stripe parameters");
      session = "cs_test_guest";
    }
    return json({
      id: "cs_test_guest",
      object: "checkout.session",
      livemode: false,
      status: "open",
      payment_status: "unpaid",
      url: `${process.env.SITE_URL}/checkout/success?session_id=cs_test_guest`,
      metadata: { checkout_kind: "pack", order_id: orderId },
    });
  }
  if (url.origin !== origin) return original(input, init);
  if (url.pathname === "/rest/v1/order_items" && !url.searchParams.has("id"))
    return json([]);
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
  if (url.pathname === "/rest/v1/rpc/create_pack_order") {
    const body = JSON.parse(init.body);
    if (body.p_user !== null || body.p_products?.[0] !== "store-pack-001")
      throw new Error("Guest pack order expected");
    token = body.p_token;
    return json(orderId);
  }
  if (url.pathname === "/rest/v1/rpc/confirm_pack_order") {
    const body = JSON.parse(init.body);
    if (
      body.p_total !== 100 ||
      body.p_email !== "guest@example.test" ||
      body.p_session !== session
    )
      return Response.json({ message: "Mismatch" }, { status: 400 });
    status = "paid";
    return json(null);
  }
  if (url.pathname === "/rest/v1/orders") {
    if (init?.method === "PATCH") return new Response(null, { status: 204 });
    if (url.searchParams.get("status") === "eq.paid" && status !== "paid")
      return Response.json({ code: "PGRST116" }, { status: 406 });
    return json({
      id: orderId,
      status,
      is_test: true,
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
      url.searchParams.get("bucket") !== "eq.lost-files-demo"
    )
      throw new Error("Missing file scope");
    if (!url.searchParams.has("id"))
      return json([{ id: fileId, download_name: "Demo.zip" }]);
    return url.searchParams.get("id") === `eq.${fileId}`
      ? json({
          bucket: "lost-files-demo",
          object_key: "private/demo.zip",
          download_name: "Demo.zip",
        })
      : Response.json({ code: "PGRST116" }, { status: 406 });
  }
  if (
    url.pathname === "/storage/v1/object/sign/lost-files-demo/private/demo.zip"
  ) {
    if (JSON.parse(init.body).expiresIn !== 60) throw new Error("Wrong expiry");
    return json({
      signedURL:
        "/object/sign/lost-files-demo/private/demo.zip?token=test-only",
    });
  }
  return original(input, init);
};
