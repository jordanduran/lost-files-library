"use client";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/stores/cart-store";
import { getBeat } from "@/data/mock-beats";

export function CartToast() {
  const notice = useCart(state => state.notice);
  const dismiss = useCart(state => state.dismissNotice);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  function close() {
    setHovered(false);
    setFocused(false);
    dismiss();
  }
  useEffect(() => {
    if (!notice || hovered || focused) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [notice, hovered, focused, dismiss]);
  const beat = notice ? getBeat(notice.beatId) : undefined;
  const license = beat?.licenses.find(item => item.id === notice?.licenseId);
  return <div className="cart-toast-region">
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {notice && `${notice.alreadyAdded ? "Already in your cart" : "Added to cart"}: ${beat?.title ?? "Item"}, ${license?.name ?? notice.licenseId}`}
    </div>
    {notice && <div className="cart-toast" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <Check size={20} aria-hidden="true" />
      <div className="cart-toast-copy">
        <strong>{notice.alreadyAdded ? "Already in your cart" : "Added to cart"}</strong>
        <p>{beat?.title ?? "Item"} · {license?.name ?? notice.licenseId}</p>
        <Link href="/cart" onClick={close}>View cart →</Link>
      </div>
      <button type="button" aria-label="Dismiss cart notification" onClick={close}><X size={18} /></button>
    </div>}
  </div>;
}
