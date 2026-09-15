"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { AccountMenu } from "@/components/account/account-menu";
import { usePackCart } from "@/stores/pack-cart-store";
import { markHomeIntroSeen } from "@/lib/home-intro";
export function SiteHeader({
  signedIn,
  accountEmail,
}: {
  signedIn: boolean;
  accountEmail?: string;
}) {
  const pathname = usePathname();
  const count = usePackCart((state) => state.items.length);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = (
    <>
      <Link
        href="/producers"
        className={pathname.startsWith("/producers") ? "nav-active" : ""}
        aria-current={pathname.startsWith("/producers") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        Producers
      </Link>
      <Link
        href="/library"
        className={pathname.startsWith("/library") ? "nav-active" : ""}
        aria-current={pathname.startsWith("/library") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        My Library
      </Link>
    </>
  );
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Link
        href="/"
        className="wordmark nav-wordmark"
        aria-label="Lost Files Library home"
        onClick={() => {
          setOpen(false);
          markHomeIntroSeen();
        }}
      >
        <BrandLogo library />
      </Link>
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation}
      </nav>
      <div className="header-actions">
        <Link
          href="/producers"
          className="icon-button"
          aria-label="Search producer archives"
        >
          <Search size={19} />
        </Link>
        <Link
          href="/cart"
          className="cart-link"
          aria-label={`Cart, ${count} packs`}
        >
          <ShoppingBag size={18} />
          <span>{count}</span>
        </Link>
        {signedIn ? (
          <AccountMenu email={accountEmail ?? "Your account"} />
        ) : (
          <Link
            className="account-avatar"
            href="/login"
            aria-label="Sign In"
            title="Sign in"
          >
            <UserRound size={18} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          ref={menuButton}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mobile-nav"
        >
          {navigation}
          <Link
            href={signedIn ? "/account" : "/login"}
            onClick={() => setOpen(false)}
          >
            {signedIn ? "Account settings" : "Sign In"}
          </Link>
        </nav>
      )}
    </header>
  );
}
