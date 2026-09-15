"use client";
import { useActionState } from "react";
import { recoverPurchases } from "@/app/recover/actions";
import { Button } from "@/components/ui/button";

export function RecoveryForm() {
  const [state, action, pending] = useActionState(recoverPurchases, {});
  return (
    <form action={action} className="account-form">
      <label htmlFor="recovery-email">Checkout email</label>
      <input
        id="recovery-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={320}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Requesting links…" : "Email my download links"}
      </Button>
      <p role={state.error ? "alert" : "status"} aria-live="polite">
        {state.error || state.message}
      </p>
    </form>
  );
}
