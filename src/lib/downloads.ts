import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminDatabase } from "@/lib/supabase/admin";

export async function purchasedFiles(userId: string, itemId: string) {
  const client = await createClient();
  if (!client) throw new Error("Database unavailable");
  const { data: item, error } = await client.from("order_items")
    .select("id,order_id,product_id,license_id,product_title,license_name,orders!inner(user_id,status,is_test)")
    .eq("id", itemId).eq("orders.user_id", userId).eq("orders.status", "paid").single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error("Unable to verify ownership");
  }
  if (!item) return null;
  const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
  const bucket = process.env.DOWNLOAD_BUCKET || "lost-files-demo";
  // Sandbox ownership must never unlock real release assets.
  if (!order || order.is_test !== (bucket === "lost-files-demo")) return null;
  const { data: files, error: fileError } = await adminDatabase().from("product_files")
    .select("id,download_name,size_bytes")
    .eq("product_id", item.product_id).eq("license_id", item.license_id)
    .eq("storage_provider", "supabase").eq("bucket", bucket)
    .order("download_name");
  if (fileError) throw new Error("Unable to load files");
  return { orderId: item.order_id, title: item.product_title, license: item.license_name, files: files ?? [] };
}
