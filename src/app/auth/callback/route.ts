import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/auth-config";

export async function GET(request: Request) {
  const origin = siteOrigin();
  if (!origin)
    return new Response("Sign-in is not configured yet.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  if (code && !params.has("error")) {
    const client = await createClient();
    if (client) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(new URL("/library", origin), {
          headers: { "Cache-Control": "private, no-store" },
        });
    }
  }
  // No caller-controlled next URL, provider details, or tokens in the destination.
  return NextResponse.redirect(new URL("/login?error=oauth", origin), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
