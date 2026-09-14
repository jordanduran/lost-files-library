"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type PackCartItem = { packId: string };
export const usePackCart = create<{
  items: PackCartItem[];
  add: (packId: string) => void;
  remove: (packId: string) => void;
  removeOwned: (packIds: string[]) => void;
}>()(
  persist(
    (set) => ({
      items: [],
      add: (packId) =>
        set((state) =>
          state.items.some((item) => item.packId === packId)
            ? state
            : { items: [...state.items, { packId }] },
        ),
      remove: (packId) =>
        set((state) => ({
          items: state.items.filter((item) => item.packId !== packId),
        })),
      removeOwned: (packIds) =>
        set((state) => ({
          items: state.items.filter((item) => !packIds.includes(item.packId)),
        })),
    }),
    { name: "lost-files-pack-cart-v1", skipHydration: true },
  ),
);
