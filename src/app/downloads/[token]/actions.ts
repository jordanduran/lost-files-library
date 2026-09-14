"use server";
import { createHmac, randomInt, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { browserHash, downloadBrowser } from "@/lib/download-browser";
import { deliveryTarget, findDeliveryOrder } from "@/lib/order-delivery";
import { emailReady } from "@/lib/purchase-emails";
import { adminDatabase } from "@/lib/supabase/admin";

export async function downloadCode(
  form: FormData,
): Promise<{ error?: string; sent?: boolean; url?: string }> {
  try {
    const token = String(form.get("token") ?? "");
    const order = await findDeliveryOrder(token);
    if (!order?.checkout_email)
      return { error: "This download is unavailable." };
    const intent = form.get("intent");
    if (intent !== "send" && intent !== "verify")
      return { error: "Please request a code." };
    const secret = await downloadBrowser(intent === "send");
    if (!secret) return { error: "Please request a new code in this browser." };
    const db = adminDatabase();
    const hashCode = (challenge: string, code: string) =>
      createHmac("sha256", secret)
        .update(`${order.id}:${challenge}:${code}`)
        .digest("hex");
    if (intent === "send") {
      if (!emailReady())
        return {
          error:
            "Email verification is temporarily unavailable. Please try again later.",
        };
      const code = String(randomInt(1000000)).padStart(6, "0");
      const challenge = randomUUID();
      const { data, error } = await db.rpc("request_download_code", {
        p_order: order.id,
        p_challenge: challenge,
        p_code_hash: hashCode(challenge, code),
        p_browser_hash: browserHash(secret),
      });
      if (error || !data)
        return {
          error:
            "Please wait a minute before requesting another code. Limit: five per hour.",
        };
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `download-code/${challenge}`,
        },
        body: JSON.stringify({
          from: process.env.PURCHASE_EMAIL_FROM,
          to: [order.checkout_email],
          subject: "Your download code — Lost Files Library",
          text: `Your download code is ${code}.\n\nEnter it in the browser where you requested it. It expires in 10 minutes. This does not create an account.\n\nIf you did not request this code, ignore this email.`,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        return {
          error: "We couldn't send the code. Wait a minute and try again.",
        };
      return { sent: true };
    }
    const code = String(form.get("code") ?? "").trim();
    if (!/^\d{6}$/.test(code))
      return { error: "Enter the six-digit code from your email." };
    const { data: challenge } = await db
      .from("download_email_codes")
      .select("challenge_id")
      .eq("order_id", order.id)
      .maybeSingle();
    if (!challenge) return { error: "Request a new code to continue." };
    const { data, error } = await db.rpc("verify_download_code", {
      p_order: order.id,
      p_code_hash: hashCode(challenge.challenge_id, code),
      p_browser_hash: browserHash(secret),
    });
    if (error || !data)
      return {
        error:
          "That code is invalid or expired. Try again or request a new one.",
      };
    return {
      url: deliveryTarget(
        token,
        String(form.get("item") ?? ""),
        String(form.get("file") ?? ""),
      ),
    };
  } catch {
    return {
      error: "Verification is temporarily unavailable. Please try again.",
    };
  }
}

export async function savePurchase(form: FormData) {
  const token = String(form.get("token") ?? "");
  const order = await findDeliveryOrder(token);
  const user = await getUser();
  if (
    !order ||
    order.user_id ||
    !user?.email_confirmed_at ||
    !user.email ||
    user.email.toLowerCase() !== order.checkout_email?.toLowerCase()
  )
    return;
  const { error } = await adminDatabase()
    .from("orders")
    .update({ user_id: user.id })
    .eq("id", order.id)
    .eq("status", "paid")
    .is("user_id", null);
  if (error) throw new Error("Could not save purchase. Please try again.");
  redirect("/library");
}
