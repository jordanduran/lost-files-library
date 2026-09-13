"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
type CartState = {
  items: CartItem[];
  requestId: string | null;
  clearPurchased: (items: CartItem[]) => void;
  add: (item: CartItem) => void;
  remove: (beatId: string, licenseId: string) => void;
};
export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  requestId: null,
  clearPurchased: (purchased) => set((state) => ({
    items: state.items.filter(item => !purchased.some(p => p.beatId === item.beatId && p.licenseId === item.licenseId)),
    requestId: crypto.randomUUID(),
  })),
  add: (item) =>
    set((state) => ({
      requestId: state.items.some(existing => existing.beatId === item.beatId && existing.licenseId === item.licenseId) ? state.requestId : crypto.randomUUID(),
      items: state.items.some(
        (existing) =>
          existing.beatId === item.beatId &&
          existing.licenseId === item.licenseId,
      )
        ? state.items
        : [...state.items, item],
    })),
  remove: (beatId, licenseId) =>
    set((state) => ({
      requestId: crypto.randomUUID(),
      items: state.items.filter(
        (item) => !(item.beatId === beatId && item.licenseId === licenseId),
      ),
    })),
}), { name: "lost-files-cart", skipHydration: true, partialize: state => ({ items: state.items, requestId: state.requestId }) }));
