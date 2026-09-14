"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/stores/cart-store";
import type { CartItem } from "@/types/cart";
export function PurchaseStatus({ status, items, guest = false }: { status: string; items: CartItem[]; guest?: boolean }) {
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
    <p>{status === "paid" ? "Your purchase is saved. Open My Library to access your downloads." : status === "pending" ? guest ? "Waiting for payment confirmation. Your downloads will open here when confirmed. We’ll also email your private link to the address entered at checkout." : "Waiting for payment confirmation. You can return to your library later; your purchase will appear once confirmed." : "This order is unavailable. Return to the pack archive for help with a new purchase."}</p>
    {status === "pending" && attempts >= 20 && <button onClick={() => { setAttempts(0); router.refresh(); }}>Check again</button>}
  </div>;
}
