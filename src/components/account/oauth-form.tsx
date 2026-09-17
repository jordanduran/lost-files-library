"use client";
import { LoadingRing } from "@/components/ui/loading-indicators";

import { useActionState } from "react";
import { oauthAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function OAuthForm({
  enabled,
  provider,
  next = "/library",
}: {
  enabled: boolean;
  provider: "google" | "github";
  next?: string;
}) {
  const [state, action, pending] = useActionState(oauthAction, {});
  return (
    <form action={action} className="account-form">
      <input type="hidden" name="next" value={next} />
      <Button type="submit" disabled={!enabled || pending} aria-busy={pending}>
        {pending && <LoadingRing />}
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
