"use client";
import { LoadingRing } from "@/components/ui/loading-indicators";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
export function PackCheckout({
  enabled,
  packIds,
  testMode = true,
}: {
  enabled: boolean;
  packIds: string[];
  testMode?: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        inFlight.current = false;
        setPending(false);
      }
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  async function openCheckout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/packs/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packIds),
      });
      const result = await response.json();
      if (response.ok && result.url) {
        window.location.assign(result.url);
        // Keep the cart and pending button in place until the browser leaves.
        return;
      }
      setError(result.error ?? "Please try again.");
    } catch {
      setError("Could not connect. Please try again.");
    }
    inFlight.current = false;
    setPending(false);
  }
  return (
    <>
      <Button
        disabled={!enabled || pending}
        onClick={openCheckout}
        aria-busy={pending}
      >
        {pending && <LoadingRing />}
        {pending
          ? "Opening checkout…"
          : testMode
            ? "Continue to test checkout"
            : "Continue to checkout"}
      </Button>
      {error && <p role="alert">{error}</p>}
      {!enabled && <p>Checkout is awaiting setup.</p>}
    </>
  );
}
