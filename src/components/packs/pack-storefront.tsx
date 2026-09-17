"use client";

import { Check, Download, FolderOpen } from "lucide-react";
import type { StorePack } from "@/data/store-packs";
import { PackArt } from "./pack-art";
import { StorePackExplorer } from "./store-pack-explorer";
import { useEffect, useState } from "react";
import { usePack } from "@/stores/pack-store";

export function PackStorefront({
  purchasedPackIds,
  packs,
  catalog = false,
}: {
  purchasedPackIds: string[];
  packs: StorePack[];
  catalog?: boolean;
}) {
  const Heading = catalog ? "h1" : "h2";
  const unlockedPacks = usePack((state) => state.unlockedProducers);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() =>
      setReady(true),
    );
  }, []);
  return (
    <section
      className="pack-storefront page-width"
      aria-labelledby="store-packs-title"
    >
      <header className="pack-storefront-heading">
        <div>
          {!catalog && <span>PACK ARCHIVE</span>}
          <Heading id="store-packs-title">
            {catalog ? "All Packs" : "Available packs."}
          </Heading>
        </div>
        <p>
          Explore sound packs and vote to unlock upcoming releases. Each purchase
          includes every file.
        </p>
      </header>
      <div className="store-pack-grid">
        {packs.map((pack) => {
          const purchased = purchasedPackIds.includes(pack.id);
          const locked =
            pack.locked &&
            !purchased &&
            !(ready && unlockedPacks.includes(pack.id));
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
                    {locked ? "LOCKED / OPEN PACK" : "OPEN PACK"}
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
