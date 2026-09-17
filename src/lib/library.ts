import "server-only";
import { checkoutIsTest } from "@/lib/checkout";
import { createClient } from "@/lib/supabase/server";

export type LibraryItem = {
  id: string;
  product_id?: string;
  product_title: string;
  license_name: string;
  file_labels: string[];
  orders: { paid_at: string };
};

export async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const client = await createClient();
  if (!client) throw new Error("Database is not configured");
  // RLS additionally enforces ownership even if another user ID is supplied.
  const { data, error } = await client
    .from("order_items")
    .select(
      "id, product_id, product_title, license_name, file_labels, orders!inner(paid_at)",
    )
    .eq("orders.user_id", userId)
    .eq("orders.status", "paid")
    .order("orders(paid_at)", { ascending: false })
    .returns<LibraryItem[]>();
  if (error) throw new Error("Unable to load purchases");
  return data ?? [];
}

export async function getPurchasedProductIds(
  userId: string,
): Promise<string[]> {
  const client = await createClient();
  if (!client) return [];
  const { data, error } = await client
    .from("order_items")
    .select("product_id, orders!inner(user_id,status,is_test)")
    .eq("orders.is_test", checkoutIsTest())
    .eq("orders.user_id", userId)
    .eq("orders.status", "paid");
  if (error) return [];
  return [...new Set((data ?? []).map((item) => item.product_id as string))];
}
