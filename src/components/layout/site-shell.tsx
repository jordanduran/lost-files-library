"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { GlobalPlayer } from "@/components/audio/global-player";
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="dark-theme site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      {path !== "/admin" && <GlobalPlayer />}
    </div>
  );
}
