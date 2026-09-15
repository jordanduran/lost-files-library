import { stripeClient } from "@/lib/checkout";
import type Stripe from "stripe";
import { deliverPurchaseEmail } from "@/lib/purchase-emails";
import { paymentCredentials } from "@/lib/payment-config";
import { adminDatabase } from "@/lib/supabase/admin";
import { processPaymentEvent } from "@/lib/payment-events";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  let verified: { event: Stripe.Event; stripe: Stripe } | undefined;
  for (const test of [true, false]) {
    const credentials = paymentCredentials(test);
    if (!credentials) continue;
    try {
      const stripe = stripeClient(test);
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        credentials.webhook,
      );
      if (event.livemode === !test) verified = { event, stripe };
      break;
    } catch {
      /* Try the other independently configured signing secret. */
    }
  }
  if (!verified) return new Response("Invalid webhook", { status: 400 });
  try {
    const orderId = await processPaymentEvent(
      verified.event,
      verified.stripe,
      adminDatabase(),
    );
    // The queue claims only paid orders, including a restored purchase if needed.
    if (orderId) await deliverPurchaseEmail(orderId);
    return Response.json({ received: true });
  } catch {
    return new Response("Payment update needs retry", { status: 500 });
  }
}
