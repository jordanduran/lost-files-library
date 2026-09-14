import "server-only";
import { adminDatabase } from "@/lib/supabase/admin";

export async function deliveryOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = adminDatabase();
  const { data: access, error } = await db.from("order_access").select("order_id").eq("token", token).is("revoked_at", null).single();
  if (error || !access) return null;
  const { data: order, error: orderError } = await db.from("orders")
    .select("id,status,is_test,paid_at,order_items(id,product_id,license_id,product_title,license_name,license_terms)")
    .eq("id", access.order_id).eq("status", "paid").single();
  if (orderError || !order) return null;
  const bucket = process.env.DOWNLOAD_BUCKET || "lost-files-demo";
  if (order.is_test !== (bucket === "lost-files-demo")) return null;
  return order;
}
