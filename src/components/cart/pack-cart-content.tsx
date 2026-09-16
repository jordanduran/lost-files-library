"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { PackArt } from "@/components/packs/pack-art";
import { purchasePacks } from "@/data/purchase-packs";
import type { CheckoutPack } from "@/lib/packs";
import { PackCheckout } from "@/components/packs/pack-checkout";
import { usePackCart } from "@/stores/pack-cart-store";
export function PackCartContent({
  purchasedPackIds,
  catalog,
  signedIn,
  checkoutEnabled,
  testMode = true,
}: {
  purchasedPackIds: string[];
  catalog: CheckoutPack[];
  signedIn: boolean;
  checkoutEnabled: boolean;
  testMode?: boolean;
}) {
  const { items, remove, removeOwned } = usePackCart();
  useEffect(() => {
    if (purchasedPackIds.length) removeOwned(purchasedPackIds);
  }, [purchasedPackIds, removeOwned]);
  const packs = items.flatMap((item) => {
    const pack = purchasePacks.find(
      (candidate) => candidate.id === item.packId,
    );
    const listing = catalog.find((candidate) => candidate.id === item.packId);
    return pack && !purchasedPackIds.includes(pack.id)
      ? [
          {
            ...pack,
            price: listing ? listing.license.price_cents / 100 : pack.price,
            listing,
          },
        ]
      : [];
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
              {pack.listing ? (
                <details>
                  <summary>{pack.listing.license.name} · ZIP + license</summary>
                  <p>{pack.listing.license.description}</p>
                  <p>{pack.listing.license.includes.join(" / ")}</p>
                  <ul>
                    {pack.listing.tracks.map((track) => (
                      <li key={track}>{track}</li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p>
                  Files and license are being prepared. Checkout is not
                  available for this pack yet.
                  {!signedIn && (
                    <>
                      {" "}
                      Approved tester?{" "}
                      <Link href="/login?next=/packs/checkout">
                        Sign in to check access
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
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
        <div className="cart-summary-heading">
          <div>
            <span className="eyebrow">ORDER FILE / SUMMARY</span>
            <h2>Pack summary</h2>
          </div>
          <Image
            className="cart-summary-logo"
            src="/brand/lost-files-mark.webp"
            alt="Lost Files Library"
            width={48}
            height={48}
            unoptimized
          />
        </div>
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
        <p className="guest-checkout-copy">
          {signedIn ? (
            "This purchase will also be saved in My Library."
          ) : (
            <>
              Continue as a guest, or{" "}
              <Link href="/login?next=/packs/checkout">sign in</Link> to save
              your packs in My Library.
            </>
          )}
        </p>
        <p className="guest-checkout-copy">
          {packs.some((pack) => pack.listing?.restrictedTest) ? (
            "Private test access: downloads will be emailed to your verified tester account."
          ) : (
            <>
              Enter your email at checkout. Your email opens a private window
              with each pack ZIP and license. No account required.
            </>
          )}
        </p>
        <PackCheckout
          testMode={testMode}
          enabled={
            checkoutEnabled && packs.every((pack) => Boolean(pack.listing))
          }
          packIds={packs.map((pack) => pack.id)}
        />
        <p>
          <LockKeyhole size={13} />{" "}
          {testMode
            ? "Stripe test checkout. No real money is charged. "
            : "Secure payment through Stripe. "}
          {testMode &&
            (packs.some((pack) => pack.listing?.restrictedTest)
              ? "Private test access does not include a commercial license."
              : "Demo packs contain synthetic test sounds.")}
        </p>
      </aside>
    </div>
  );
}
