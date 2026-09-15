"use client";

import { Check, Download, Folder } from "lucide-react";
import { storePacks } from "@/data/store-packs";
import { StorePackExplorer } from "./store-pack-explorer";

export function PackStorefront({
  purchasedPackIds,
}: {
  purchasedPackIds: string[];
}) {
  return (
    <section
      className="pack-storefront page-width"
      aria-labelledby="store-packs-title"
    >
      <header className="pack-storefront-heading">
        <div>
          <span>OPEN FILES / NO HACK REQUIRED</span>
          <h2 id="store-packs-title">Available packs.</h2>
        </div>
        <p>
          Instant-access sound packs. Purchase the complete archive and download
          every included file.
        </p>
      </header>
      <div className="store-pack-grid">
        {storePacks.map((pack) => {
          const purchased = purchasedPackIds.includes(pack.id);
          return (
            <article
              className="store-pack-card desktop-pack-file"
              data-owned={purchased}
              data-art={pack.art}
              key={pack.id}
            >
              {purchased && (
                <div className="store-pack-owned">
                  <Check size={12} /> OWNED
                </div>
              )}
              <StorePackExplorer pack={pack} purchased={purchased}>
                <button className="desktop-pack-folder">
                  <Folder size={58} strokeWidth={1.25} aria-hidden="true" />
                  <strong>{pack.title}</strong>
                  <span>
                    {pack.files} FILES&nbsp;&nbsp; ${pack.price}
                  </span>
                </button>
              </StorePackExplorer>
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
