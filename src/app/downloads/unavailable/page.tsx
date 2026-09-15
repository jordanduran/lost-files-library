import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download unavailable",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export { DownloadUnavailable as default } from "@/components/packs/download-unavailable";
