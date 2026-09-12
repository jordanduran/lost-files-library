"use client";
import { create } from "zustand";
import { beats } from "@/data/mock-beats";
type PlayerState = {
  trackId: string | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  play: (id: string) => void;
  toggle: () => void;
  skip: (direction: number) => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  close: () => void;
  pause: () => void;
};
export const usePlayer = create<PlayerState>((set) => ({
  trackId: null,
  isPlaying: false,
  progress: 0,
  volume: 75,
  play: (id) =>
    set((state) => ({
      trackId: id,
      progress: state.trackId === id ? state.progress : 0,
      isPlaying: state.trackId === id ? !state.isPlaying : true,
    })),
  toggle: () =>
    set((state) => (state.trackId ? { isPlaying: !state.isPlaying } : {})),
  skip: (direction) =>
    set((state) => ({
      trackId:
        beats[
          (beats.findIndex((beat) => beat.id === state.trackId) +
            direction +
            beats.length) %
            beats.length
        ].id,
      progress: 0,
    })),
  seek: (progress) =>
    set(
      progress >= 100
        ? { trackId: null, isPlaying: false, progress: 0 }
        : { progress: Math.max(0, progress) },
    ),
  setVolume: (volume) => set({ volume }),
  close: () => set({ trackId: null, isPlaying: false, progress: 0 }),
  pause: () => set({ isPlaying: false }),
}));
