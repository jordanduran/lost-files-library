import { HomeLanding } from "@/components/home/home-landing";
import { publicPacks, asProducer } from "@/lib/managed-packs";
import { asStorePack } from "@/lib/pack-presentation";
import { PackStorefront } from "@/components/packs/pack-storefront";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";

export default async function Home() {
  const user = await getUser();
  const packs = await publicPacks();
  const featured = packs.find((p) => p.featured);
  const purchasedPackIds = user ? await getPurchasedProductIds(user.id) : [];
  return featured ? (
    <HomeLanding
      producer={asProducer(featured)}
      purchasedPackIds={purchasedPackIds}
      packs={packs.filter((p) => p.id !== featured.id).map(asStorePack)}
    />
  ) : (
    <div className="home-landing" data-ready="true">
      <PackStorefront
        packs={packs.map(asStorePack)}
        purchasedPackIds={purchasedPackIds}
      />
      {!packs.length && (
        <p className="page-width">
          No packs are available yet. Check back soon.
        </p>
      )}
    </div>
  );
}
