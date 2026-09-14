import { checkoutDatabase, stripeClient } from "@/lib/checkout";
import type Stripe from "stripe";
import { deliverPurchaseEmail } from "@/lib/purchase-emails";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }
  if (event.livemode) return new Response("Test payments only", { status: 400 });
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      if (!session.metadata?.order_id || !session.metadata?.user_id || session.amount_total === null || !session.currency) return new Response("Missing order details", { status: 400 });
      const { error } = await checkoutDatabase().rpc("confirm_test_order", {
        p_order: session.metadata.order_id, p_user: session.metadata.user_id,
        p_session: session.id, p_total: session.amount_total, p_currency: session.currency,
      });
      if (error) return new Response("Order confirmation failed", { status: 500 });
      try { await deliverPurchaseEmail(session.metadata.order_id); }
      catch { return new Response("Purchase saved; email retry needed", { status: 500 }); }
    }
  }
  return Response.json({ received: true });
}
