import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  return (
    <section className="account-panel">
      <span className="eyebrow">YOUR PERSONAL ARCHIVE</span>
      <h1>Your account.</h1>
      <p className="account-email">{user.email}</p>
      <p>Your purchases stay with this account, wherever you sign in.</p>
      {user.app_metadata.role === "admin" && (
        <p>
          <Link href="/admin" className="text-link">
            Manage packs
          </Link>
        </p>
      )}
      <Link href="/library" className="text-link">
        Go to My Library
      </Link>
      {error === "signout" && (
        <p role="alert">We could not sign you out. Please try again.</p>
      )}
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </section>
  );
}
