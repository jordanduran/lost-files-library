import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { siteOrigin } from "@/lib/auth-config";

export function checkoutReady() {
  return Boolean(siteOrigin() && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}
export function stripeClient() {
  if (!checkoutReady()) throw new Error("Test checkout is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { httpClient: Stripe.createFetchHttpClient() });
}
export function checkoutDatabase() {
  if (!checkoutReady()) throw new Error("Test checkout is not configured");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
