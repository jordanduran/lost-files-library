"use client";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(max-width: 650px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
export function useCompactWindow() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(max-width: 650px)").matches,
    () => true,
  );
}
