"use client";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, LockKeyhole, Trash2 } from "lucide-react";
import { useCart } from "@/stores/cart-store";
import { getBeat } from "@/data/mock-beats";
import { Artwork } from "@/components/beats/artwork";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { money } from "@/lib/utils";
export function CartContent() {
  const { items, remove } = useCart();
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
          Two sample items are included to demonstrate the cart. Your changes
          last while this app is open.
        </p>
      </section>
      <aside className="cart-summary">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
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
        <Notice
          title="Checkout is coming soon"
          description="This storefront is a working frontend preview. Payments are not connected, and no charge will be made. Your selected products and licenses remain in your cart."
        >
          <Button className="w-full">
            Proceed to Checkout <ArrowUpRight />
          </Button>
        </Notice>
        <p>
          <LockKeyhole size={13} /> Payments are not enabled in this preview.
        </p>
      </aside>
    </div>
  );
}
