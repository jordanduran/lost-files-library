"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/stores/cart-store";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { GlobalPlayer } from "@/components/audio/global-player";
import { usePlayer } from "@/stores/player-store";
import { CursorBackground } from "./cursor-background";
import { CartToast } from "@/components/cart/cart-toast";
export function SiteShell({
  children,
  signedIn,
  accountEmail,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  accountEmail?: string;
}) {
  const path = usePathname();
  useEffect(() => { void useCart.persist.rehydrate(); }, []);
  const playerOpen = usePlayer((state) => state.trackId !== null);
  return (
    <div
      className={`dark-theme site-shell${playerOpen && path !== "/admin" ? " has-player" : ""}`}
    >
      <CursorBackground />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader signedIn={signedIn} accountEmail={accountEmail} />
      <CartToast />
      <main id="main">
        {path !== "/" && <div className="page-brand page-width">
          <Image src="/brand/lost-files-mark.webp" alt="Lost Files logo" width={80} height={80} unoptimized className="page-brand-mark" />
        </div>}
        {children}
      </main>
      <SiteFooter />
      <GlobalPlayer hidden={path === "/admin"} />
    </div>
  );
}
