"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/stores/cart-store";
import type { CartItem } from "@/types/cart";
export function PurchaseStatus({ status, items }: { status: string; items: CartItem[] }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const itemKey = JSON.stringify(items);
  useEffect(() => {
    if (status === "paid") {
      let active = true;
      void Promise.resolve(useCart.persist.rehydrate()).then(() => {
        if (active) useCart.getState().clearPurchased(JSON.parse(itemKey));
      });
      return () => { active = false; };
    }
  }, [status, itemKey]);
  useEffect(() => {
    if (status !== "pending" || attempts >= 20) return;
    const timer = setTimeout(() => { setAttempts(value => value + 1); router.refresh(); }, 2000);
    return () => clearTimeout(timer);
  }, [status, attempts, router]);
  return <div aria-live="polite">
    <p>{status === "paid" ? "Your test purchase is saved. File downloads are the next feature to connect." : status === "pending" ? "Waiting for payment confirmation. You can return to your library later; your purchase will appear once confirmed." : "This order was not completed. Return to your cart to try again."}</p>
    {status === "pending" && attempts >= 20 && <button onClick={() => { setAttempts(0); router.refresh(); }}>Check again</button>}
  </div>;
}
