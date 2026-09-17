"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingRing } from "@/components/ui/loading-indicators";
export function DownloadButton({
  itemId,
  fileId,
}: {
  itemId: string;
  fileId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/downloads/${itemId}/${fileId}`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error("Download unavailable");
      window.location.assign(result.url);
    } catch {
      setError(
        "Could not download this file. Please sign in again or retry shortly.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button onClick={download} disabled={pending} aria-busy={pending}>
        {pending ? <LoadingRing /> : <Download size={16} />}
        {pending ? "Preparing…" : "Download"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
