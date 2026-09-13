"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { startCheckout } from "@/app/cart/actions";
import { ArrowLeft, ArrowUpRight, LockKeyhole, Trash2 } from "lucide-react";
import { useCart } from "@/stores/cart-store";
import { getBeat } from "@/data/mock-beats";
import { Artwork } from "@/components/beats/artwork";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";
export function CartContent({ signedIn, checkoutEnabled }: { signedIn: boolean; checkoutEnabled: boolean }) {
  const { items, remove, requestId } = useCart();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function checkout() {
    setError("");
    startTransition(async () => {
      try {
        const result = await startCheckout({ items, requestId });
        if (result.url) window.location.assign(result.url);
        else setError(result.error ?? "Could not start checkout.");
      } catch { setError("Could not connect. Please try again."); }
    });
  }
  const resolved = items.flatMap((item) => {
    const beat = getBeat(item.beatId);
    const license = beat?.licenses.find((l) => l.id === item.licenseId);
    return beat && license ? [{ beat, license }] : [];
  });
  const total = resolved.reduce((sum, item) => sum + item.license.price, 0);
  if (!resolved.length)
    return (
      <div className="empty-state">
        <h2>Your next chapter starts here.</h2>
        <p>Your cart is empty. Find a sound that speaks to you.</p>
        <Button asChild>
          <Link href="/beats">
            Browse Beats <ArrowUpRight />
          </Link>
        </Button>
      </div>
    );
  return (
    <div className="cart-grid">
      <section aria-label="Cart items">
        <div className="cart-table-heading">
          <span>PRODUCT / LICENSE</span>
          <span>PRICE</span>
        </div>
        {resolved.map(({ beat, license }) => (
          <article className="cart-item" key={`${beat.id}-${license.id}`}>
            <Link href={`/beats/${beat.slug}`}>
              <Artwork kind={beat.artwork} title={beat.title} />
            </Link>
            <div>
              <Link href={`/beats/${beat.slug}`} className="track-title">
                {beat.title}
              </Link>
              <p>Produced by {beat.producer}</p>
              <span className="cart-license">{license.name}</span>
            </div>
            <div className="cart-item-end">
              <strong>{money(license.price)}</strong>
              <button
                aria-label={`Remove ${beat.title}, ${license.name}`}
                onClick={() => remove(beat.id, license.id)}
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </article>
        ))}
        <Link className="text-link continue-link" href="/beats">
          <ArrowLeft size={15} /> Continue exploring
        </Link>
        <p className="sample-note">
          Your cart is saved on this browser. Review final catalog prices on Stripe before confirming payment.
        </p>
      </section>
      <aside className="cart-summary">
        <span className="eyebrow">ORDER FILE / SUMMARY</span>
        <h2>Order summary</h2>
        <dl>
          <div>
            <dt>
              Subtotal <span>({resolved.length} items)</span>
            </dt>
            <dd>{money(total)}</dd>
          </div>
          <div>
            <dt>Discount</dt>
            <dd>{money(0)}</dd>
          </div>
          <div className="cart-total">
            <dt>Total</dt>
            <dd>
              {money(total)} <small>USD</small>
            </dd>
          </div>
        </dl>
        {signedIn ? <Button className="w-full" onClick={checkout} disabled={!checkoutEnabled || pending}>
          {pending ? "Opening checkout…" : "Test Checkout"} <ArrowUpRight />
        </Button> : <Button asChild className="w-full"><Link href="/login">Sign in to checkout <ArrowUpRight /></Link></Button>}
        {error && <p role="alert">{error}</p>}
        <p>
          <LockKeyhole size={13} /> {checkoutEnabled ? "Test payments only. No real money is charged." : "Test checkout is awaiting setup."}
        </p>
      </aside>
    </div>
  );
}
