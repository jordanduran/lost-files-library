"use client";

import { Check, Download, FolderOpen } from "lucide-react";
import type { StorePack } from "@/data/store-packs";
import { PackArt } from "./pack-art";
import { StorePackExplorer } from "./store-pack-explorer";

export function PackStorefront({
  purchasedPackIds,
  packs,
}: {
  purchasedPackIds: string[];
  packs: StorePack[];
}) {
  return (
    <section
      className="pack-storefront page-width"
      aria-labelledby="store-packs-title"
    >
      <header className="pack-storefront-heading">
        <div>
          <span>PACK ARCHIVE</span>
          <h2 id="store-packs-title">Available packs.</h2>
        </div>
        <p>
          Instant-access sound packs. Purchase the complete archive and download
          every included file.
        </p>
      </header>
      <div className="store-pack-grid">
        {packs.map((pack) => {
          const purchased = purchasedPackIds.includes(pack.id);
          return (
            <article
              className="store-pack-card"
              data-owned={purchased}
              key={pack.id}
            >
              <PackArt pack={pack} />
              {purchased && (
                <div className="store-pack-owned">
                  <Check size={13} /> PURCHASED / IN YOUR LIBRARY
                </div>
              )}
              <div className="store-pack-meta">
                <span>{pack.files} FILES</span>
                <span>{pack.format}</span>
              </div>
              <h3>{pack.title}</h3>
              <p>{pack.description}</p>
              <footer>
                <strong>${pack.price}</strong>
                <StorePackExplorer pack={pack} purchased={purchased}>
                  <button
                    className="store-pack-open"
                    onMouseDown={(event) => {
                      // Focus without scrolling the footer away from a card click.
                      event.preventDefault();
                      event.currentTarget.focus({ preventScroll: true });
                    }}
                  >
                    <FolderOpen size={14} />{" "}
                    {pack.locked ? "LOCKED / OPEN PACK" : "OPEN PACK"}
                  </button>
                </StorePackExplorer>
              </footer>
            </article>
          );
        })}
      </div>
      <p className="store-pack-note">
        <Download size={13} /> ONE PURCHASE / COMPLETE PACK / SECURE DOWNLOAD
      </p>
    </section>
  );
}
