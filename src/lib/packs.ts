import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { adminDatabase } from "@/lib/supabase/admin";
export type CheckoutPack = {
  id: string;
  title: string;
  tracks: string[];
  restrictedTest?: boolean;
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
    .eq("test_restricted", false)
    .eq("published", true);
  if (error || !data) return [];
  const user = await getUser();
  let restricted: typeof data = [];
  const restrictedIds = new Set<string>();
  if (user?.email_confirmed_at) {
    const admin = adminDatabase();
    const { data: access, error: accessError } = await admin.rpc(
      "tester_pack_ids",
      { p_user: user.id },
    );
    const ids: string[] =
      !accessError && access
        ? access.map((row: { product_id: string }) => row.product_id)
        : [];
    if (ids.length) {
      const result = await admin
        .from("products")
        .select(
          "id,title,pack_tracks,product_licenses(id,name,description,includes,price_cents)",
        )
        .in("id", ids)
        .eq("kind", "pack")
        .eq("test_restricted", true);
      restricted = result.data ?? [];
      restricted.forEach((pack) => restrictedIds.add(pack.id));
    }
  }
  return [
    ...data.filter((pack) => !restrictedIds.has(pack.id)),
    ...restricted,
  ].flatMap((pack) => {
    const license = pack.product_licenses.find((item) => item.id === "pack");
    return license
      ? [
          {
            id: pack.id,
            title: pack.title,
            tracks: pack.pack_tracks as string[],
            restrictedTest: restrictedIds.has(pack.id),
            license,
          },
        ]
      : [];
  });
}
