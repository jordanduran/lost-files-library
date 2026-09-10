"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Local preview only. Community votes and ownership need a server before launch.
export const usePack = create(
  persist<{ unlocked: boolean; unlock: () => void; unvote: () => void }>(
    (set) => ({
      unlocked: false,
      unlock: () => set({ unlocked: true }),
      unvote: () => set({ unlocked: false }),
    }),
    { name: "archive-pack-vote-v1", skipHydration: true },
  ),
);
