"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(loginAction, {
    email: "",
    step: "email",
  });
  return (
    <form action={action} className="account-form">
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        defaultValue={state.email}
        readOnly={state.step === "code"}
        disabled={!enabled}
      />
      {state.step === "code" && (
        <>
          <label htmlFor="code">Sign-in code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
          />
        </>
      )}
      <div aria-live="polite" role={state.error ? "alert" : "status"}>
        {state.error || state.message}
      </div>
      <Button
        type="submit"
        name="intent"
        value={state.step === "code" ? "verify" : "send"}
        disabled={pending || !enabled}
      >
        {pending
          ? "Please wait…"
          : state.step === "code"
            ? "Verify and sign in"
            : "Send sign-in code"}
      </Button>
      {state.step === "code" && (
        <>
          <Button
            type="submit"
            variant="outline"
            name="intent"
            value="send"
            formNoValidate
            disabled={pending}
          >
            Resend code
          </Button>
          <a href="/login" className="text-link">
            Use a different email
          </a>
        </>
      )}
      <p>
        New here? Your first sign-in creates your account. No password needed.
      </p>
    </form>
  );
}
