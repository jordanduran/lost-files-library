"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { purchasePacks as storePacks } from "@/data/purchase-packs";
import { usePackCart } from "@/stores/pack-cart-store";

export function PackCartToast() {
  const notice = usePackCart((state) => state.notice);
  const dismiss = usePackCart((state) => state.dismissNotice);
  const pack = notice
    ? storePacks.find((item) => item.id === notice.packId)
    : undefined;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice) return null;
  return createPortal(
    <div className="cart-toast-region" style={{ zIndex: 140 }}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="cart-toast"
      >
        <Check size={20} aria-hidden="true" />
        <div className="cart-toast-copy">
          <strong>
            {notice.alreadyAdded
              ? "Already in your cart"
              : "Pack added to cart"}
          </strong>
          <p>
            {pack
              ? `${pack.title} · $${pack.price} · Complete pack`
              : "Complete pack"}
          </p>
          <Link href="/cart" onClick={dismiss}>
            View cart →
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss cart notification"
          onClick={dismiss}
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
