import type { Metadata } from "next";
import { PackCartContent } from "@/components/cart/pack-cart-content";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
import { checkoutPacks } from "@/lib/packs";
import { checkoutReady, checkoutIsTest } from "@/lib/checkout";
export const metadata: Metadata = { title: "Your Pack Cart" };
export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await getUser();
  const purchasedPackIds = user ? await getPurchasedProductIds(user.id) : [];
  const catalog = await checkoutPacks();
  const { canceled } = await searchParams;
  return (
    <div className="page-width cart-page">
      <div className="page-intro">
        <span className="eyebrow">ORDER FILE / COMPLETE PACKS</span>
        <h1>Your cart.</h1>
        <p>
          Review your packs. Pay. Download your ZIPs and licenses. No account
          required.
        </p>
        {canceled && (
          <p role="status">
            Checkout canceled. Your packs are still in your cart.
          </p>
        )}
      </div>
      <PackCartContent
        purchasedPackIds={purchasedPackIds}
        catalog={catalog}
        signedIn={Boolean(user)}
        checkoutEnabled={checkoutReady()}
        testMode={checkoutIsTest()}
      />
    </div>
  );
}
