"use client";
import { useRef, useState } from "react";
import { LoadingRing } from "@/components/ui/loading-indicators";

export function DeliveryDownloadButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function download() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch(href, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Download unavailable");
      const result = await response.json();
      if (typeof result.url !== "string")
        throw new Error("Download unavailable");
      const link = document.createElement("a");
      link.href = result.url;
      link.referrerPolicy = "no-referrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage("Download requested. Check your browser’s downloads.");
    } catch {
      setFailed(true);
      setMessage("Could not start the download. Please try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="delivery-download">
      <button
        type="button"
        className="delivery-button"
        disabled={pending}
        aria-busy={pending}
        onClick={download}
      >
        {pending && <LoadingRing />}
        {pending ? "Preparing download…" : label}
      </button>
      {message && (
        <p className="delivery-note" role={failed ? "alert" : "status"}>
          {message}
        </p>
      )}
    </div>
  );
}
