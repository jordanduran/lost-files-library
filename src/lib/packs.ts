import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function afterHoursPack() {
  const db = await createClient();
  if (!db) return null;
  const { data, error } = await db.from("products")
    .select("id,title,pack_tracks,product_licenses(id,name,description,includes,price_cents)")
    .eq("id", "after-hours-001").eq("kind", "pack").eq("published", true).single();
  if (error || !data) return null;
  const license = data.product_licenses.find(item => item.id === "pack");
  return license ? { id: data.id, title: data.title, tracks: data.pack_tracks as string[], license } : null;
}
