"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { AccountMenu } from "@/components/account/account-menu";
import { usePackCart } from "@/stores/pack-cart-store";
import { markHomeIntroSeen } from "@/lib/home-intro";
export function SiteHeader({
  signedIn,
  accountEmail,
  isAdmin,
}: {
  signedIn: boolean;
  accountEmail?: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const count = usePackCart((state) => state.items.length);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 761px)");
    // CSS can hide the mobile link before matchMedia fires and reset focus to body.
    let focusedElement: Node | null = document.activeElement;
    const closeOnDesktop = () => {
      if (!desktop.matches) return;
      if (
        focusedElement === menuButton.current ||
        header.current?.querySelector(".mobile-nav")?.contains(focusedElement)
      ) {
        header.current
          ?.querySelector<HTMLAnchorElement>(".desktop-nav a")
          ?.focus();
      }
      setOpen(false);
    };
    const closeOutside = (event: Event) => {
      if (event.type === "focusin") {
        if (desktop.matches) return;
        focusedElement = event.target instanceof Node ? event.target : null;
      }
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const close = () => setOpen(false);
    desktop.addEventListener("change", closeOnDesktop);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    window.addEventListener("popstate", close);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      window.removeEventListener("popstate", close);
    };
  }, [open]);
  const navigation = (
    <>
      <Link
        href="/producers"
        className={pathname.startsWith("/producers") ? "nav-active" : ""}
        aria-current={pathname.startsWith("/producers") ? "page" : undefined}
      >
        Producers
      </Link>
      <Link
        href="/packs"
        className={pathname.startsWith("/packs") ? "nav-active" : ""}
        aria-current={pathname.startsWith("/packs") ? "page" : undefined}
      >
        Packs
      </Link>
      <Link
        href="/discover"
        className={pathname === "/discover" ? "nav-active" : ""}
        aria-current={pathname === "/discover" ? "page" : undefined}
      >
        Discover
      </Link>
      <Link
        href="/library"
        className={pathname.startsWith("/library") ? "nav-active" : ""}
        aria-current={pathname.startsWith("/library") ? "page" : undefined}
      >
        My Library
      </Link>
    </>
  );
  return (
    <header
      className="site-header"
      ref={header}
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("a, .account-menu summary")
        ) {
          setOpen(false);
        }
      }}
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
          href="/cart"
          className="cart-link"
          aria-label={`Cart, ${count} packs`}
        >
          <ShoppingBag size={18} />
          <span>{count}</span>
        </Link>
        {signedIn ? (
          <AccountMenu
            email={accountEmail ?? "Your account"}
            isAdmin={isAdmin}
          />
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
          onClick={() => {
            const account =
              header.current?.querySelector<HTMLDetailsElement>(
                ".account-menu",
              );
            if (account) account.open = false;
            setOpen(!open);
          }}
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
          {isAdmin && (
            <Link
              href="/admin"
              className={pathname.startsWith("/admin") ? "nav-active" : ""}
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            >
              Manage packs
            </Link>
          )}
          <Link href={signedIn ? "/account" : "/login"}>
            {signedIn ? "Account settings" : "Sign In"}
          </Link>
        </nav>
      )}
    </header>
  );
}
