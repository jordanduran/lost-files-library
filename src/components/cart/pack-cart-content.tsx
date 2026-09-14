"use client";
import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { PackArt } from "@/components/packs/pack-art";
import { storePacks } from "@/data/store-packs";
import { usePackCart } from "@/stores/pack-cart-store";
export function PackCartContent({
  purchasedPackIds,
}: {
  purchasedPackIds: string[];
}) {
  const { items, remove, removeOwned } = usePackCart();
  useEffect(() => {
    if (purchasedPackIds.length) removeOwned(purchasedPackIds);
  }, [purchasedPackIds, removeOwned]);
  const packs = items.flatMap((item) => {
    const pack = storePacks.find((candidate) => candidate.id === item.packId);
    return pack && !purchasedPackIds.includes(pack.id) ? [pack] : [];
  });
  const total = packs.reduce((sum, pack) => sum + pack.price, 0);
  if (!packs.length)
    return (
      <div className="empty-state">
        <h2>No packs queued.</h2>
        <p>
          Open an available pack, preview its files, then add the complete pack
          here.
        </p>
        <Link className="pack-cart-primary" href="/#store-packs-title">
          Browse available packs <ArrowUpRight size={15} />
        </Link>
      </div>
    );
  return (
    <div className="pack-cart-grid">
      <section aria-label="Pack cart items">
        <div className="cart-table-heading">
          <span>PACK FILE</span>
          <span>PRICE</span>
        </div>
        {packs.map((pack) => (
          <article className="pack-cart-item" key={pack.id}>
            <div className="pack-cart-cover">
              <PackArt pack={pack} />
            </div>
            <div>
              <strong>{pack.title}</strong>
              <p>
                {pack.producer} / {pack.files} PREVIEW FILES
              </p>
              <span>
                <Check size={12} /> COMPLETE PACK
              </span>
            </div>
            <div>
              <b>${pack.price}</b>
              <button
                onClick={() => remove(pack.id)}
                aria-label={`Remove ${pack.title}`}
              >
                <Trash2 size={13} /> REMOVE
              </button>
            </div>
          </article>
        ))}
        <Link className="text-link continue-link" href="/#store-packs-title">
          <ArrowLeft size={15} /> Continue exploring
        </Link>
      </section>
      <aside className="cart-summary">
        <span className="eyebrow">ORDER FILE / SUMMARY</span>
        <h2>Pack summary</h2>
        <dl>
          <div>
            <dt>
              Subtotal <span>({packs.length} packs)</span>
            </dt>
            <dd>${total}</dd>
          </div>
          <div className="cart-total">
            <dt>Total</dt>
            <dd>
              ${total} <small>USD</small>
            </dd>
          </div>
        </dl>
        <button className="pack-checkout-disabled" disabled>
          CHECKOUT SETUP PENDING
        </button>
        <p>
          <LockKeyhole size={13} /> Demo cart only. Supabase pack records and
          ZIP downloads must be connected before payment.
        </p>
      </aside>
    </div>
  );
}
