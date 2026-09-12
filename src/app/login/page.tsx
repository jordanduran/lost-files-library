import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await getUser()) redirect("/library");
  const enabled = Boolean(supabaseConfig());
  return (
    <section className="account-panel">
      <span className="eyebrow">YOUR PERSONAL ARCHIVE</span>
      <h1>Welcome to the library.</h1>
      <p>Sign in to keep your purchases together, wherever you create.</p>
      {!enabled && (
        <p className="preview-banner">
          Accounts are being set up. Sign-in will be available soon.
        </p>
      )}
      <LoginForm enabled={enabled} />
    </section>
  );
}
