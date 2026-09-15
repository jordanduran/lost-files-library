import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const objectId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id;

// The caller verifies the signature and mode before reaching this handler.
export async function processPaymentEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: SupabaseClient,
): Promise<string | null> {
  const test = !event.livemode;
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.payment_status !== "paid") return null;
    if (session.livemode !== event.livemode)
      throw new Error("Payment mode mismatch");
    const orderId = session.metadata?.order_id;
    if (!orderId || session.amount_total === null || !session.currency)
      throw new Error("Missing order details");
    if (session.metadata?.checkout_kind !== "pack") {
      if (!test || !session.metadata?.user_id) return null;
      const { error } = await db.rpc("confirm_test_order", {
        p_order: orderId,
        p_user: session.metadata.user_id,
        p_session: session.id,
        p_total: session.amount_total,
        p_currency: session.currency,
      });
      if (error) throw new Error("Order confirmation failed");
      return orderId;
    }
    const { error } = await db.rpc("confirm_store_order", {
      p_order: orderId,
      p_session: session.id,
      p_total: session.amount_total,
      p_currency: session.currency,
      p_email: session.customer_details?.email ?? session.customer_email,
      p_test: test,
      p_payment_intent: objectId(session.payment_intent) ?? null,
    });
    if (error) throw new Error("Order confirmation failed");
    return orderId;
  }
  let chargeId: string | undefined;
  let dispute: Stripe.Dispute | undefined;
  if (event.type === "charge.refunded") chargeId = event.data.object.id;
  else if (
    event.type === "refund.created" ||
    event.type === "refund.updated" ||
    event.type === "refund.failed"
  ) {
    chargeId = objectId(event.data.object.charge);
  } else if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.updated" ||
    event.type === "charge.dispute.closed"
  ) {
    dispute = await stripe.disputes.retrieve(event.data.object.id);
    if (dispute.livemode !== event.livemode)
      throw new Error("Dispute mode mismatch");
    chargeId = objectId(dispute.charge);
  } else return null;
  if (!chargeId) return null;
  const charge = await stripe.charges.retrieve(chargeId);
  if (charge.livemode !== event.livemode)
    throw new Error("Charge mode mismatch");
  const intent = objectId(charge.payment_intent);
  if (!intent) return null;
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: intent,
    limit: 100,
  });
  const session = sessions.data.find(
    (item) => item.metadata?.checkout_kind === "pack" && item.metadata.order_id,
  );
  if (!session) return null;
  if (
    session.livemode !== event.livemode ||
    objectId(session.payment_intent) !== intent ||
    session.amount_total !== charge.amount ||
    session.currency !== charge.currency
  )
    throw new Error("Payment event mismatch");
  let refunded = 0;
  // Pending/failed refunds do not revoke access. Iterate beyond the first page.
  for await (const refund of stripe.refunds.list({
    charge: charge.id,
    limit: 100,
  })) {
    if (refund.status === "succeeded") refunded += refund.amount;
  }
  const disputeStatus = !dispute
    ? null
    : ["won", "warning_closed", "prevented"].includes(dispute.status)
      ? "won"
      : dispute.status === "lost"
        ? "lost"
        : "open";
  const orderId = session.metadata!.order_id;
  const { error } = await db.rpc("apply_order_payment_event", {
    p_order: orderId,
    p_session: session.id,
    p_payment_intent: intent,
    p_test: test,
    p_total: charge.amount,
    p_currency: charge.currency,
    p_refunded: refunded,
    p_dispute: dispute?.id ?? null,
    p_dispute_status: disputeStatus,
  });
  if (error) throw new Error("Payment update failed");
  return orderId;
}
