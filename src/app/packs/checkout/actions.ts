"use server";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/auth-config";
import { checkoutDatabase, checkoutReady, stripeClient } from "@/lib/checkout";

export async function startPackCheckout(): Promise<{ url?: string; error?: string }> {
  if (!checkoutReady()) return { error: "Test checkout is awaiting setup." };
  try {
    const jar = await cookies();
    const user = await getUser();
    const cookieName = `pack-checkout-${user?.id ?? "guest"}`;
    const previous = jar.get(cookieName)?.value;
    const credential = previous && /^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(previous)
      ? previous : `${randomUUID()}.${randomBytes(32).toString("hex")}`;
    jar.set(cookieName, credential, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 3600 });
    const [requestId, token] = credential.split(".");
    const db = checkoutDatabase();
    const { data: id, error } = await db.rpc("create_pack_order", { p_user: user?.id ?? null, p_request: requestId, p_token: token, p_product: "after-hours-001" });
    if (error) return { error: "This pack is not ready for checkout yet. Please try again later." };
    const { data: order, error: readError } = await db.from("orders").select("status,created_at,checkout_session_id,order_items(product_title,license_name,unit_price_cents)").eq("id", id).single();
    if (readError || !order) throw new Error("Order unavailable");
    if (order.status === "paid") return { url: `/downloads/${token}` };
    if (order.status !== "pending" || Date.now() - Date.parse(order.created_at) > 23 * 3600000) {
      jar.delete(cookieName);
      return { error: "Checkout expired. Please try again to start a new checkout." };
    }
    const stripe = stripeClient();
    const session = order.checkout_session_id ? await stripe.checkout.sessions.retrieve(order.checkout_session_id) : await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"], managed_payments: { enabled: false },
      client_reference_id: id, metadata: { order_id: id, checkout_kind: "pack" },
      line_items: order.order_items.map(item => ({ quantity: 1, price_data: { currency: "usd", unit_amount: item.unit_price_cents, product_data: { name: `${item.product_title} — ${item.license_name}` } } })),
      success_url: `${siteOrigin()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin()}/packs/checkout?canceled=1`,
    }, { idempotencyKey: `pack-order-${id}` });
    const { error: saveError } = await db.from("orders").update({ checkout_session_id: session.id }).eq("id", id).is("checkout_session_id", null);
    if (saveError) throw new Error("Could not save checkout");
    if (session.status === "complete") return { url: `/checkout/success?session_id=${session.id}` };
    if (!session.url || session.status === "expired") {
      jar.delete(cookieName);
      return { error: "Checkout expired. Please try again." };
    }
    return { url: session.url };
  } catch { return { error: "Checkout is unavailable. Please try again." }; }
}
