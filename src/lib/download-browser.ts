import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { adminDatabase } from "@/lib/supabase/admin";

const cookieName = "lost-files-download-browser";
export const browserHash = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");
export async function downloadBrowser(create = false) {
  const jar = await cookies();
  const existing = jar.get(cookieName)?.value;
  const secret = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : null;
  if (!create) return secret;
  const value = secret ?? randomBytes(32).toString("hex");
  jar.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
  return value;
}

// Called only after the server has created/recovered the checkout with its
// separate HttpOnly checkout credential. A URL token never grants a session.
export async function registerPurchaseBrowser(orderId: string) {
  const secret = (await downloadBrowser(true))!;
  const { error } = await adminDatabase()
    .from("download_browser_sessions")
    .upsert({
      order_id: orderId,
      secret_hash: browserHash(secret),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
  if (error) throw new Error("Download access unavailable");
}
