import "server-only";
import { createClient } from "@/lib/supabase/server";
export type CheckoutPack = {
  id: string;
  title: string;
  tracks: string[];
  license: {
    name: string;
    description: string;
    includes: string[];
    price_cents: number;
  };
};
export async function checkoutPacks(): Promise<CheckoutPack[]> {
  const db = await createClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(
      "id,title,pack_tracks,product_licenses(id,name,description,includes,price_cents)",
    )
    .eq("kind", "pack")
    .eq("published", true);
  if (error || !data) return [];
  return data.flatMap((pack) => {
    const license = pack.product_licenses.find((item) => item.id === "pack");
    return license
      ? [
          {
            id: pack.id,
            title: pack.title,
            tracks: pack.pack_tracks as string[],
            license,
          },
        ]
      : [];
  });
}
