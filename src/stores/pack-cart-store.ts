"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type PackCartItem = { packId: string };
type PackCartNotice = {
  id: string;
  packId: string;
  alreadyAdded: boolean;
  title?: string;
  price?: number;
};
export const usePackCart = create<{
  items: PackCartItem[];
  notice: PackCartNotice | null;
  add: (packId: string, title?: string, price?: number) => void;
  dismissNotice: () => void;
  remove: (packId: string) => void;
  removeOwned: (packIds: string[]) => void;
}>()(
  persist(
    (set) => ({
      items: [],
      notice: null,
      dismissNotice: () => set({ notice: null }),
      add: (packId, title, price) =>
        set((state) => {
          const alreadyAdded = state.items.some(
            (item) => item.packId === packId,
          );
          return {
            notice: {
              id: crypto.randomUUID(),
              packId,
              alreadyAdded,
              title,
              price,
            },
            items: alreadyAdded ? state.items : [...state.items, { packId }],
          };
        }),
      remove: (packId) =>
        set((state) => ({
          items: state.items.filter((item) => item.packId !== packId),
        })),
      removeOwned: (packIds) =>
        set((state) => ({
          items: state.items.filter((item) => !packIds.includes(item.packId)),
        })),
    }),
    {
      name: "lost-files-pack-cart-v1",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
