"use client";

import { useActionState } from "react";
import { oauthAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function OAuthForm({
  enabled,
  provider,
}: {
  enabled: boolean;
  provider: "google" | "github";
}) {
  const [state, action, pending] = useActionState(oauthAction, {});
  return (
    <form action={action} className="account-form">
      <Button type="submit" disabled={!enabled || pending}>
        {pending
          ? "Connecting…"
          : `Continue with ${provider === "google" ? "Google" : "GitHub"}`}
      </Button>
      {state.error && <p role="alert">{state.error}</p>}
      <p>
        Your first sign-in creates your account. Your purchases stay with you
        each time you return.
      </p>
    </form>
  );
}
