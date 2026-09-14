"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { AccountMenu } from "@/components/account/account-menu";
export function SiteHeader({
  signedIn,
  accountEmail,
}: {
  signedIn: boolean;
  accountEmail?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navigation = (
    <>
      <Link href="/producers" className={pathname.startsWith("/producers") ? "nav-active" : ""} onClick={() => setOpen(false)}>Producers</Link>
      <Link href="/producers/allen-ritter" onClick={() => setOpen(false)}>Current Target</Link>
    </>
  );
  return (
    <header className="site-header">
      <Link
        href="/"
        className="wordmark nav-wordmark"
        aria-label="Lost Files Library home"
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
        {signedIn ? (
          <AccountMenu email={accountEmail ?? "Your account"} />
        ) : (
          <Link className="account-avatar" href="/login" aria-label="Sign In" title="Sign in">
            <UserRound size={18} />
          </Link>
        )}
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
