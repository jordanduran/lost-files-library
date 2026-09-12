"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  email: string;
  step: "email" | "code";
  error?: string;
  message?: string;
};

export async function loginAction(
  previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const intent = form.get("intent");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { email, step: "email", error: "Enter a valid email address." };
  }
  const client = await createClient();
  if (!client)
    return {
      email,
      step: "email",
      error: "Sign-in is not available yet. Please try again later.",
    };
  if (intent === "send") {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error)
      return {
        email,
        step: previous.step,
        error: "We couldn't send a code. Wait a minute and try again.",
      };
    return {
      email,
      step: "code",
      message: "Check your email for your sign-in code.",
    };
  }
  if (intent !== "verify")
    return { email, step: "email", error: "Please request a sign-in code." };
  const token = String(form.get("code") ?? "").trim();
  if (!/^\d{6,10}$/.test(token))
    return { email, step: "code", error: "Enter the code from your email." };
  const { error } = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error)
    return {
      email,
      step: "code",
      error:
        "That code is invalid or expired. Try again or request a new code.",
    };
  revalidatePath("/", "layout");
  redirect("/library");
}

export async function signOut() {
  const client = await createClient();
  if (client) {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) redirect("/account?error=signout");
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
