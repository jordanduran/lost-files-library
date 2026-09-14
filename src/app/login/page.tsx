import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "@/components/account/login-form";
import { OAuthForm } from "@/components/account/oauth-form";
import { authErrors, authErrorReason } from "@/lib/auth-errors";
import {
  emailLoginEnabled,
  oauthProvider,
  siteOrigin,
} from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const { error, reason, next: requestedNext } = await searchParams;
  const next = requestedNext === "/packs/checkout" ? "/packs/checkout" : "/library";
  if (await getUser()) redirect(next);
  const enabled = Boolean(supabaseConfig() && siteOrigin());
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
      {error === "oauth" && (
        <p role="alert">
          {reason
            ? authErrors[authErrorReason(reason)]
            : "Sign-in was canceled or could not be completed. Please try again."}
          {reason && (
            <>
              <br />
              <small>Error reference: {authErrorReason(reason)}</small>
            </>
          )}
        </p>
      )}
      <OAuthForm enabled={enabled} provider={oauthProvider()} next={next} />
      {emailLoginEnabled() && <LoginForm enabled={Boolean(supabaseConfig())} next={next} />}
    </section>
  );
}
