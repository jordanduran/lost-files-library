import { HomeLanding } from "@/components/home/home-landing";
import { producers } from "@/data/producers";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";

export default async function Home() {
  const user = await getUser();
  const purchasedPackIds = user ? await getPurchasedProductIds(user.id) : [];
  return (
    <HomeLanding producer={producers[0]} purchasedPackIds={purchasedPackIds} />
  );
}
