"use client";

import { ArrowUpRight, Download, ShoppingBag } from "lucide-react";
import { Notice } from "@/components/ui/notice";
import { storePacks } from "@/data/store-packs";
import { PackArt } from "./pack-art";

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
              <Notice
                title="Pack checkout is coming next"
                description={`${pack.title} is polished placeholder inventory. Once its ZIP and catalog record are connected, this button will add the complete pack to cart for $${pack.price}.`}
              >
                <button>
                  <ShoppingBag size={14} /> PURCHASE PACK{" "}
                  <ArrowUpRight size={14} />
                </button>
              </Notice>
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
