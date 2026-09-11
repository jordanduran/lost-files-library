"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { brand } from "@/lib/config";
import { useCart } from "@/stores/cart-store";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
export function SiteHeader() {
  const pathname = usePathname();
  const count = useCart((s) => s.items.length);
  const [open, setOpen] = useState(false);
  const navigation = (
    <>
      <Link
        className={pathname.startsWith("/beats") ? "nav-active" : ""}
        href="/beats"
        onClick={() => setOpen(false)}
      >
        Beats
      </Link>
      <Link
        href="/packs"
        className={pathname.startsWith("/packs") ? "nav-active" : ""}
        onClick={() => setOpen(false)}
      >
        Packs
      </Link>
      <Link href="/#producers" onClick={() => setOpen(false)}>
        Producers
      </Link>
      <Link href="/#about" onClick={() => setOpen(false)}>
        About
      </Link>
    </>
  );
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label={`${brand.name} home`}>
        <BrandLogo />
      </Link>
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation}
      </nav>
      <div className="header-actions">
        <Link
          href="/beats#search"
          className="icon-button"
          aria-label="Search beats"
        >
          <Search size={19} />
        </Link>
        <Link
          href="/cart"
          className="cart-link"
          aria-label={`Cart, ${count} items`}
        >
          <ShoppingBag size={18} />
          <span>{count}</span>
        </Link>
        <Notice
          title="Your account, coming soon"
          description="Sign-in will be connected when accounts are available. You can explore the sample purchased library now."
        >
          <button className="sign-in">
            Sign In <ArrowUpRight size={14} />
          </button>
        </Notice>
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav aria-label="Mobile navigation" className="mobile-nav">
          {navigation}
          <Link href="/library" onClick={() => setOpen(false)}>
            My Library
          </Link>
        </nav>
      )}
    </header>
  );
}
