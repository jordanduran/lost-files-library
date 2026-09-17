import { publicPacks } from "@/lib/managed-packs";
import { asStorePack } from "@/lib/pack-presentation";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
import { PackStorefront } from "@/components/packs/pack-storefront";
export const metadata = { title: "Packs" };
export default async function PacksPage() {
  const user = await getUser();
  return (
    <PackStorefront
      catalog
      packs={(await publicPacks()).map(asStorePack)}
      purchasedPackIds={user ? await getPurchasedProductIds(user.id) : []}
    />
  );
}
