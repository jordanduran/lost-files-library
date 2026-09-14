"use client";
import { useEffect } from "react";
import { usePackCart } from "@/stores/pack-cart-store";
export function ClearPurchasedPacks({ packIds }: { packIds: string[] }) {
  const key = JSON.stringify(packIds);
  useEffect(() => {
    let active = true;
    void Promise.resolve(usePackCart.persist.rehydrate()).then(() => {
      if (active) usePackCart.getState().removeOwned(JSON.parse(key));
    });
    return () => {
      active = false;
    };
  }, [key]);
  return null;
}
