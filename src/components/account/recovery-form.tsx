"use client";
import { useActionState } from "react";
import { recoverPurchases } from "@/app/recover/actions";
import { Button } from "@/components/ui/button";

export function RecoveryForm() {
  const [state, action, pending] = useActionState(
    async (previous: { message?: string; error?: string }, form: FormData) => {
      try {
        return await recoverPurchases(previous, form);
      } catch {
        return { error: "Could not connect. Please try again." };
      }
    },
    {},
  );
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
        aria-describedby="recovery-feedback"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Requesting links…" : "Email my download links"}
      </Button>
      <p id="recovery-feedback" role={state.error ? "alert" : "status"}>
        {state.error || state.message}
      </p>
    </form>
  );
}
