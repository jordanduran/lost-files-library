"use client";
import { create } from "zustand";
import type { CartItem } from "@/types/cart";
type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (beatId: string, licenseId: string) => void;
};
export const useCart = create<CartState>((set) => ({
  items: [
    { beatId: "beat-1", licenseId: "mp3" },
    { beatId: "beat-3", licenseId: "wav" },
  ],
  add: (item) =>
    set((state) => ({
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
      items: state.items.filter(
        (item) => !(item.beatId === beatId && item.licenseId === licenseId),
      ),
    })),
}));
