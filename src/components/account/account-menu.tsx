"use client";

import Link from "next/link";
import { useRef } from "react";
import { UserRound } from "lucide-react";
import { signOut } from "@/app/login/actions";

export function AccountMenu({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (details.current) details.current.open = false;
  };
  return (
    <details
      className="account-menu"
      ref={details}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
          details.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label={`Account: ${email}, signed in`}>
        <span className="account-avatar">
          <UserRound size={18} />
          <span className="account-status-dot" />
        </span>
      </summary>
      <div className="account-menu-panel">
        <p>Signed in as</p>
        <strong className="account-email">{email}</strong>
        <Link href="/library" onClick={close}>
          My Library
        </Link>
        <Link href="/account" onClick={close}>
          Account settings
        </Link>
        {isAdmin && (
          <Link href="/admin" onClick={close}>
            Manage packs
          </Link>
        )}
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    </details>
  );
}
