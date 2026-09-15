import { timingSafeEqual } from "node:crypto";
import { adminDatabase } from "@/lib/supabase/admin";
import { deliverPurchaseEmail, emailReady } from "@/lib/purchase-emails";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.EMAIL_JOB_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return new Response("Unauthorized", { status: 401 });
  if (!emailReady())
    return new Response("Email is not configured", { status: 503 });
  const { data, error } = await adminDatabase()
    .from("purchase_emails")
    .select("order_id,orders!inner(status)")
    .eq("orders.status", "paid")
    .in("status", ["pending", "sending"])
    .order("created_at")
    .limit(5);
  if (error) return new Response("Queue unavailable", { status: 503 });
  let failed = 0;
  for (const job of data ?? []) {
    try {
      await deliverPurchaseEmail(job.order_id);
    } catch {
      failed++;
    }
  }
  return Response.json(
    { processed: data?.length ?? 0, failed },
    { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
