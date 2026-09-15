"use server";
import { after } from "next/server";
import { headers } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";
import { adminDatabase } from "@/lib/supabase/admin";
import { emailReady } from "@/lib/purchase-emails";
import { siteOrigin } from "@/lib/auth-config";
import { recoveryEmail } from "@/lib/recovery-email-template";

export async function recoverPurchases(
  _state: { message?: string; error?: string },
  form: FormData,
): Promise<{ message?: string; error?: string }> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter the email address used at checkout." };
  if (!emailReady() || !process.env.SUPABASE_SECRET_KEY || !siteOrigin())
    return {
      error:
        "Purchase recovery is temporarily unavailable. Please try again later.",
    };
  const requestHeaders = await headers();
  const ip = process.env.VERCEL
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    : "local";
  const hash = (value: string) =>
    createHmac("sha256", process.env.SUPABASE_SECRET_KEY!)
      .update(value)
      .digest("hex");
  const emailHash = hash(`recovery-email:${email}`),
    ipHash = hash(`recovery-ip:${ip}`);
  // All valid requests receive the same response before any purchase lookup.
  // No account existence, order details, tokens, or sending errors reach the caller.
  after(async () => {
    try {
      const { data, error } = await adminDatabase().rpc(
        "request_purchase_recovery",
        { p_email: email, p_email_hash: emailHash, p_ip_hash: ipHash },
      );
      if (error) throw new Error("Recovery lookup failed");
      if (!data?.length) return;
      const payload = recoveryEmail(siteOrigin()!, data);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `recovery/${randomUUID()}`,
        },
        body: JSON.stringify({
          from: process.env.PURCHASE_EMAIL_FROM,
          to: [data[0].recipient],
          ...payload,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Recovery email failed");
    } catch {
      console.error("Purchase recovery could not be completed.");
    }
  });
  return {
    message:
      "If that email has available purchases, we’ll send the download links. Check your inbox and spam folder. Please wait a minute before trying again.",
  };
}
