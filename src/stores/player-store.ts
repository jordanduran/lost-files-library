"use client";
import { create } from "zustand";
import { beats } from "@/data/mock-beats";
type PlayerState = {
  trackId: string;
  isPlaying: boolean;
  progress: number;
  volume: number;
  play: (id: string) => void;
  toggle: () => void;
  skip: (direction: number) => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
};
export const usePlayer = create<PlayerState>((set) => ({
  trackId: beats[0].id,
  isPlaying: false,
  progress: 0,
  volume: 75,
  play: (id) =>
    set((state) => ({
      trackId: id,
      progress: state.trackId === id ? state.progress : 0,
      isPlaying: state.trackId === id ? !state.isPlaying : true,
    })),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
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
  seek: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),
}));
