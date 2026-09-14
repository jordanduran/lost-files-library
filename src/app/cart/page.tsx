import type { Metadata } from "next";
import { PackCartContent } from "@/components/cart/pack-cart-content";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
export const metadata: Metadata = { title: "Your Pack Cart" };
export default async function CartPage() {
  const user = await getUser();
  const purchasedPackIds = user ? await getPurchasedProductIds(user.id) : [];
  return (
    <div className="page-width cart-page">
      <div className="page-intro">
        <span className="eyebrow">ORDER FILE / COMPLETE PACKS</span>
        <h1>Your cart.</h1>
        <p>Complete packs only. Individual beats are never sold separately.</p>
      </div>
      <PackCartContent purchasedPackIds={purchasedPackIds} />
    </div>
  );
}
