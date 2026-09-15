import "server-only";
import Stripe from "stripe";
import { adminDatabase } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/auth-config";
import { paymentCredentials, paymentMode } from "@/lib/payment-config";

export function checkoutIsTest() {
  return paymentMode() !== "live";
}

export function checkoutReady() {
  return Boolean(
    paymentMode() &&
    siteOrigin() &&
    paymentCredentials(checkoutIsTest()) &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}
export function stripeClient(test = checkoutIsTest()) {
  const credentials = paymentCredentials(test);
  if (!credentials) throw new Error("Checkout is not configured");
  return new Stripe(credentials.key, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
export function checkoutDatabase() {
  if (!checkoutReady()) throw new Error("Checkout is not configured");
  return adminDatabase();
}
