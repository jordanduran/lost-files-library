import "server-only";
import { adminDatabase } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { browserHash, downloadBrowser } from "@/lib/download-browser";

export async function findDeliveryOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = adminDatabase();
  const { data: access, error } = await db
    .from("order_access")
    .select("order_id")
    .eq("token", token)
    .is("revoked_at", null)
    .single();
  if (error || !access) return null;
  const { data: order, error: orderError } = await db
    .from("orders")
    .select(
      "id,user_id,checkout_email,status,is_test,paid_at,order_items(id,product_id,license_id,product_title,license_name,license_terms)",
    )
    .eq("id", access.order_id)
    .eq("status", "paid")
    .single();
  if (orderError || !order) return null;
  const bucket = process.env.DOWNLOAD_BUCKET || "lost-files-demo";
  if (order.is_test !== (bucket === "lost-files-demo")) return null;
  return order;
}

export async function hasDeliveryAccess(
  order: NonNullable<Awaited<ReturnType<typeof findDeliveryOrder>>>,
) {
  const user = await getUser();
  if (user && order.user_id === user.id) return true;
  // A verified matching account may recover its guest purchase, without
  // silently claiming purchases for accounts with unverified email addresses.
  if (
    !order.user_id &&
    user?.email_confirmed_at &&
    user.email &&
    user.email.toLowerCase() === order.checkout_email?.toLowerCase()
  )
    return true;
  const secret = await downloadBrowser();
  if (!secret) return false;
  const { data, error } = await adminDatabase()
    .from("download_browser_sessions")
    .select("order_id")
    .eq("order_id", order.id)
    .eq("secret_hash", browserHash(secret))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return !error && Boolean(data);
}

export async function deliveryOrder(token: string) {
  const order = await findDeliveryOrder(token);
  return order && (await hasDeliveryAccess(order)) ? order : null;
}

export function deliveryTarget(token: string, item?: string, file?: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return "/library";
  if (
    item &&
    /^[a-f0-9-]{36}$/i.test(item) &&
    file &&
    /^(zip|license|[a-f0-9-]{36})$/i.test(file)
  )
    return `/api/delivery/${token}/${item}/${file}`;
  return `/downloads/${token}`;
}
