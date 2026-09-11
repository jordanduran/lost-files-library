"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { GlobalPlayer } from "@/components/audio/global-player";
import { usePlayer } from "@/stores/player-store";
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const playerOpen = usePlayer((state) => state.trackId !== null);
  return (
    <div
      className={`dark-theme site-shell${playerOpen && path !== "/admin" ? " has-player" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <GlobalPlayer hidden={path === "/admin"} />
    </div>
  );
}
