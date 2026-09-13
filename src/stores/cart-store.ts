"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
type CartState = {
  items: CartItem[];
  requestId: string | null;
  notice: (CartItem & { id: string; alreadyAdded: boolean }) | null;
  dismissNotice: () => void;
  clearPurchased: (items: CartItem[]) => void;
  add: (item: CartItem) => void;
  remove: (beatId: string, licenseId: string) => void;
};
export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  requestId: null,
  notice: null,
  dismissNotice: () => set({ notice: null }),
  clearPurchased: (purchased) => set((state) => ({
    items: state.items.filter(item => !purchased.some(p => p.beatId === item.beatId && p.licenseId === item.licenseId)),
    requestId: crypto.randomUUID(),
  })),
  add: (item) =>
    set((state) => ({
      notice: { ...item, id: crypto.randomUUID(), alreadyAdded: state.items.some(existing => existing.beatId === item.beatId && existing.licenseId === item.licenseId) },
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
