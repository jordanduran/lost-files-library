import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LibraryItem = {
  id: string;
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
      "id, product_title, license_name, file_labels, orders!inner(paid_at)",
    )
    .eq("orders.user_id", userId)
    .eq("orders.status", "paid")
    .order("orders(paid_at)", { ascending: false })
    .returns<LibraryItem[]>();
  if (error) throw new Error("Unable to load purchases");
  return data ?? [];
}
