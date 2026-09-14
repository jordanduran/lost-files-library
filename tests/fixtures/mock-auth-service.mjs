// Test-process preload only. Never imported by application code.
// No real accounts or outbound Supabase requests are used in these tests.
import { loadEnvFile } from "node:process";
import { createHash, createHmac } from "node:crypto";
try {
  loadEnvFile(".env.local");
} catch {
  /* CI supplies env directly. */
}
const authOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const user = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: process.env.AUTH_TEST_EMAIL || "listener@example.test",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: {},
  identities: [],
};
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const payload = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
const token = `${payload}.${createHmac("sha256", "local-test-secret").update(payload).digest("base64url")}`;
let signedOut = false;
const cityVotes = new Set();
const actualFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.origin !== authOrigin) return actualFetch(input, init);
  const json = (body, status = 200) =>
    Response.json(body, {
      status,
      headers: { "x-supabase-api-version": "2024-01-01" },
    });
  if (url.pathname === "/auth/v1/token") {
    const body = JSON.parse(init.body);
    const challenge = createHash("sha256")
      .update(body.code_verifier ?? "")
      .digest("base64url");
    if (body.auth_code !== `test-code-${challenge}`)
      return json(
        { code: "bad_code_verifier", msg: "Test verifier mismatch" },
        400,
      );
    signedOut = false;
    return json({
      access_token: token,
      refresh_token: "local-test-refresh",
      token_type: "bearer",
      expires_in: 3600,
      user,
    });
  }
  const authenticated =
    new Headers(init?.headers).get("authorization") === `Bearer ${token}` &&
    !signedOut;
  if (url.pathname === "/auth/v1/user")
    return authenticated
      ? json(user)
      : json({ code: "session_not_found", msg: "No test session" }, 401);
  if (url.pathname === "/auth/v1/logout") {
    signedOut = true;
    return new Response(null, { status: 204 });
  }
  if (url.pathname === "/rest/v1/rpc/producer_city_standings") return json([...cityVotes].map(city=>({city,votes:1})));
  if (url.pathname === "/rest/v1/producer_city_votes") {
    if (init?.method === "POST") { cityVotes.add(JSON.parse(init.body).city); return new Response(null,{status:201}); }
    if (init?.method === "DELETE") { cityVotes.delete(url.searchParams.get("city")?.slice(3)); return new Response(null,{status:204}); }
    return json([...cityVotes].map(city=>({city})));
  }
  if (url.pathname === "/rest/v1/rpc/tester_pack_ids") return json([]);
  if (url.pathname === "/rest/v1/products") return json([]);
  if (url.pathname === "/rest/v1/order_items") {
    if (!authenticated) return json({ message: "Forbidden" }, 403);
    if (!url.searchParams.has("id")) return json([]);
    if (url.searchParams.get("orders.user_id") !== `eq.${user.id}` || url.searchParams.get("orders.status") !== "eq.paid") throw new Error("Ownership filter missing");
    if (url.searchParams.get("id") !== "eq.30000000-0000-0000-0000-000000000001") return json({ code: "PGRST116" }, 406);
    return json({ id: "30000000-0000-0000-0000-000000000001", product_id: "beat-1", license_id: "wav", product_title: "Midnight Drive", license_name: "WAV License", orders: { user_id: user.id, status: "paid", is_test: true } });
  }
  if (url.pathname === "/rest/v1/product_files") {
    if (url.searchParams.has("id")) return json({ bucket: "lost-files-demo", object_key: "private/demo.wav", download_name: "synthetic-demo.wav" });
    if (url.searchParams.get("product_id") !== "eq.beat-1" || url.searchParams.get("license_id") !== "eq.wav") throw new Error("License filter missing");
    return json([{ id: "40000000-0000-0000-0000-000000000001", download_name: "synthetic-demo.wav", size_bytes: 4096 }]);
  }
  if (url.pathname === "/storage/v1/bucket/lost-files-demo") return json({ id: "lost-files-demo", name: "lost-files-demo", public: false });
  if (url.pathname === "/storage/v1/object/sign/lost-files-demo/private/demo.wav") {
    if (JSON.parse(init.body).expiresIn !== 60) throw new Error("Unexpected expiry");
    return json({ signedURL: "/object/sign/lost-files-demo/private/demo.wav?token=test-only" });
  }
  throw new Error(`Unexpected test Supabase endpoint: ${url.pathname}`);
};
