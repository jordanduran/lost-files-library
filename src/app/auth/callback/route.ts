import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/auth-config";
import { authErrorReason } from "@/lib/auth-errors";

export async function GET(request: Request) {
  const origin = siteOrigin();
  if (!origin)
    return new Response("Sign-in is not configured yet.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  let reason = authErrorReason(
    params.get("error_code") || params.get("error") || "missing_code",
  );
  if (code && !params.has("error")) {
    const client = await createClient();
    if (client) {
      const flowId = params.get("sb_flow_id");
      const { error } = await client.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (!error)
        return NextResponse.redirect(new URL(params.get("next") === "/packs/checkout" ? "/packs/checkout" : "/library", origin), {
          headers: { "Cache-Control": "private, no-store" },
        });
      reason =
        error.name === "AuthRetryableFetchError"
          ? "auth_service_unreachable"
          : authErrorReason(error.code);
      // Log only a known error category, never codes, tokens, cookies, or user data.
      console.warn("[auth] Session exchange failed:", reason);
    }
  }
  // No caller-controlled next URL, provider details, or tokens in the destination.
  return NextResponse.redirect(
    new URL(`/login?error=oauth&reason=${reason}`, origin),
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
