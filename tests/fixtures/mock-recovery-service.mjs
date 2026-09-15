import "./mock-auth-service.mjs";
import { writeFileSync } from "node:fs";
const original = globalThis.fetch;
const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
let sent = 0;
let requests = 0;
writeFileSync(".tools/mock-recovery-result.json", JSON.stringify({ sent }));
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (
    url.origin === origin &&
    url.pathname === "/rest/v1/rpc/request_purchase_recovery"
  ) {
    const body = JSON.parse(init.body);
    if (
      !/^[a-f0-9]{64}$/.test(body.p_email_hash) ||
      !/^[a-f0-9]{64}$/.test(body.p_ip_hash)
    )
      throw new Error("Missing hashed limits");
    if (body.p_email === "failure@example.test")
      return Response.json(
        { message: "Database unavailable" },
        { status: 503 },
      );
    if (body.p_email !== "buyer@example.test" || requests++ > 0)
      return Response.json([]);
    return Response.json([
      {
        token: "a".repeat(64),
        recipient: "buyer@example.test",
        is_test: true,
        titles: ["Test Pack"],
      },
    ]);
  }
  if (url.origin === "https://api.resend.com") {
    const body = JSON.parse(init.body);
    if (body.to[0] !== "buyer@example.test") throw new Error("Wrong recipient");
    sent++;
    writeFileSync(
      ".tools/mock-recovery-result.json",
      JSON.stringify({ sent, text: body.text }),
    );
    return Response.json({ id: "mock-recovery-email" });
  }
  return original(input, init);
};
