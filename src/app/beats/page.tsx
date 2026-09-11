import type { Metadata } from "next";
import { BeatCatalog } from "@/components/beats/beat-catalog";
export const metadata: Metadata = { title: "Browse Beats" };
export default function BeatsPage() {
  return (
    <div className="page-width catalog-page">
      <div className="page-intro">
        <span className="eyebrow">FILE INDEX / BEAT ARCHIVE</span>
        <h1>
          Find your sound<span className="subtle-dot">.</span>
        </h1>
        <p>Browse original beats, compositions, and sounds.</p>
      </div>
      <BeatCatalog />
    </div>
  );
}
