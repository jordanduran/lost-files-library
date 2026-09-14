import "server-only";
import { adminDatabase } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/auth-config";
import { purchaseEmail } from "@/lib/purchase-email-template";

export function emailReady() {
  return process.env.PURCHASE_EMAIL_ENABLED === "true" && Boolean(process.env.RESEND_API_KEY && process.env.PURCHASE_EMAIL_FROM && siteOrigin());
}
export async function deliverPurchaseEmail(orderId: string) {
  if (!emailReady()) return;
  const db = adminDatabase();
  const { data: jobs, error } = await db.rpc("claim_purchase_email", { p_order: orderId });
  if (error) throw new Error("Email queue unavailable");
  const job = jobs?.[0];
  if (!job) return;
  try {
    let payload = job.payload;
    if (!payload) {
      const { data: order, error: orderError } = await db.from("orders").select("is_test,order_items(product_title,license_name)").eq("id", orderId).eq("status", "paid").single();
      if (orderError || !order) throw new Error("Order unavailable");
      const email = purchaseEmail(siteOrigin()!, order.order_items.map(item => ({ title: item.product_title, license: item.license_name })), order.is_test);
      payload = { from: process.env.PURCHASE_EMAIL_FROM, to: [job.recipient], ...email };
      const { error: saveError } = await db.from("purchase_emails").update({ payload }).eq("order_id", orderId);
      if (saveError) throw new Error("Email snapshot unavailable");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `purchase/${orderId}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Email delivery failed");
    const result = await response.json();
    if (typeof result.id !== "string") throw new Error("Email response invalid");
    const { error: saveError } = await db.from("purchase_emails").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: result.id }).eq("order_id", orderId);
    if (saveError) throw new Error("Email delivery status unavailable");
  } catch {
    await db.from("purchase_emails").update({ status: "pending" }).eq("order_id", orderId).eq("status", "sending");
    throw new Error("Purchase email delivery needs retry");
  }
}
