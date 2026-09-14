"use client";

import { Download, FolderOpen } from "lucide-react";
import { storePacks } from "@/data/store-packs";
import { PackArt } from "./pack-art";
import { StorePackExplorer } from "./store-pack-explorer";

export function PackStorefront() {
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
        {storePacks.map((pack) => (
          <article className="store-pack-card" key={pack.id}>
            <PackArt pack={pack} />
            <div className="store-pack-meta">
              <span>{pack.files} FILES</span>
              <span>{pack.format}</span>
            </div>
            <h3>{pack.title}</h3>
            <p>{pack.description}</p>
            <footer>
              <strong>${pack.price}</strong>
              <StorePackExplorer pack={pack}>
                <button>
                  <FolderOpen size={14} /> OPEN PACK
                </button>
              </StorePackExplorer>
            </footer>
          </article>
        ))}
      </div>
      <p className="store-pack-note">
        <Download size={13} /> ONE PURCHASE / COMPLETE PACK / SECURE DOWNLOAD
      </p>
    </section>
  );
}
