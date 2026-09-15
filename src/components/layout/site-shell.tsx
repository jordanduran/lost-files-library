"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/stores/cart-store";
import { usePackCart } from "@/stores/pack-cart-store";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { GlobalPlayer } from "@/components/audio/global-player";
import { usePlayer } from "@/stores/player-store";
import { CursorBackground } from "./cursor-background";
import { PackCartToast } from "@/components/cart/pack-cart-toast";
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
  useEffect(() => {
    void useCart.persist.rehydrate();
    void usePackCart.persist.rehydrate();
  }, []);
  const playerOpen = usePlayer((state) => state.trackId !== null);
  return (
    <div
      className={`dark-theme site-shell${path === "/preview/original" ? "" : " file-system-theme"}${playerOpen && path !== "/admin" ? " has-player" : ""}`}
    >
      <CursorBackground />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader signedIn={signedIn} accountEmail={accountEmail} />
      <PackCartToast />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <GlobalPlayer hidden={path === "/admin"} />
    </div>
  );
}
