import type { Metadata } from "next";
import { CartContent } from "@/components/cart/cart-content";
export const metadata: Metadata = { title: "Your Cart" };
export default function CartPage() {
  return (
    <div className="page-width cart-page">
      <div className="page-intro">
        <span className="eyebrow">ORDER FILE / YOUR SELECTION</span>
        <h1>Your cart.</h1>
        <p>The sounds for whatever comes next.</p>
      </div>
      <CartContent />
    </div>
  );
}
