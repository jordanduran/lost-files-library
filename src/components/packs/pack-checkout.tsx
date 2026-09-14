"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startPackCheckout } from "@/app/packs/checkout/actions";
export function PackCheckout({ enabled }: { enabled: boolean }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <><Button disabled={!enabled || pending} onClick={() => start(async () => {
    setError("");
    try {
      const result = await startPackCheckout();
      if (result.url) window.location.assign(result.url);
      else setError(result.error ?? "Please try again.");
    } catch { setError("Could not connect. Please try again."); }
  })}>{pending ? "Opening checkout…" : "Continue to test checkout"}</Button>
    {error && <p role="alert">{error}</p>}
    {!enabled && <p>Checkout is awaiting setup.</p>}</>;
}
