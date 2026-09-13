import type { Metadata } from "next";
import { CartContent } from "@/components/cart/cart-content";
import { getUser } from "@/lib/auth";
import { checkoutReady } from "@/lib/checkout";
export const metadata: Metadata = { title: "Your Cart" };
export default async function CartPage() {
  const user = await getUser();
  return (
    <div className="page-width cart-page">
      <div className="page-intro">
        <span className="eyebrow">ORDER FILE / YOUR SELECTION</span>
        <h1>Your cart.</h1>
        <p>The sounds for whatever comes next.</p>
      </div>
      <CartContent signedIn={Boolean(user)} checkoutEnabled={checkoutReady()} />
    </div>
  );
}
