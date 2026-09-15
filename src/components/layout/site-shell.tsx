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
import Link from "next/link";
import { FileText, FolderOpen, Globe2, Monitor } from "lucide-react";
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
  const desktopTheme =
    path === "/" ||
    path === "/cart" ||
    path === "/library" ||
    path === "/account" ||
    path === "/login" ||
    path === "/recover" ||
    path === "/hard-drive" ||
    path === "/packs" ||
    path.startsWith("/producers");
  useEffect(() => {
    void useCart.persist.rehydrate();
    void usePackCart.persist.rehydrate();
  }, []);
  const playerOpen = usePlayer((state) => state.trackId !== null);
  return (
    <div
      className={`dark-theme site-shell${path === "/preview/original" ? "" : " file-system-theme"}${desktopTheme ? " desktop-workspace" : ""}${playerOpen && path !== "/admin" ? " has-player" : ""}`}
    >
      <CursorBackground />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader signedIn={signedIn} accountEmail={accountEmail} />
      {desktopTheme && (
        <nav className="desktop-shortcuts" aria-label="Desktop shortcuts">
          <Link href="/">
            <Monitor aria-hidden="true" />
            <span>My Computer</span>
          </Link>
          <Link href="/#store-packs-title">
            <FolderOpen aria-hidden="true" />
            <span>Packs</span>
          </Link>
          <Link href="/producers">
            <Globe2 aria-hidden="true" />
            <span>Producers</span>
          </Link>
          <Link href="/library">
            <FileText aria-hidden="true" />
            <span>My Library</span>
          </Link>
        </nav>
      )}
      <PackCartToast />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <GlobalPlayer hidden={path === "/admin"} />
    </div>
  );
}
