"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Local demo only. Community votes need authenticated server enforcement before launch.
export const usePack = create(
  persist<{
    unlockedProducers: string[];
    unlock: (slug: string) => void;
    lock: (slug: string) => void;
  }>(
    (set) => ({
      unlockedProducers: [],
      unlock: (slug) =>
        set((state) => ({
          unlockedProducers: state.unlockedProducers.includes(slug)
            ? state.unlockedProducers
            : [...state.unlockedProducers, slug],
        })),
      lock: (slug) =>
        set((state) => ({
          unlockedProducers: state.unlockedProducers.filter(
            (producer) => producer !== slug,
          ),
        })),
    }),
    { name: "lost-files-producer-votes-v1", skipHydration: true },
  ),
);
