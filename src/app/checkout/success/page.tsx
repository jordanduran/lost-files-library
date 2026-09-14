import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { checkoutDatabase, stripeClient } from "@/lib/checkout";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PurchaseStatus } from "@/components/cart/purchase-status";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string; session_id?: string }> }) {
  const query = await searchParams;
  if (query.session_id) {
    if (!/^cs_test_[a-zA-Z0-9]+$/.test(query.session_id)) notFound();
    const session = await stripeClient().checkout.sessions.retrieve(query.session_id).catch(() => null);
    if (!session || session.livemode || session.metadata?.checkout_kind !== "pack" || !session.metadata.order_id) notFound();
    const db = checkoutDatabase();
    const { data: order } = await db.from("orders").select("id,status,checkout_session_id").eq("id", session.metadata.order_id).single();
    if (!order || (order.checkout_session_id && order.checkout_session_id !== session.id)) notFound();
    if (order.status === "paid") {
      const { data: access } = await db.from("order_access").select("token").eq("order_id", order.id).is("revoked_at", null).single();
      if (access) redirect(`/downloads/${access.token}`);
    }
    return <div className="page-width cart-page"><h1>{order.status === "pending" ? "Checking your payment." : "This order is unavailable."}</h1>
      <PurchaseStatus status={order.status} items={[]} guest />
      <Link href="/packs">Back to packs</Link></div>;
  }
  const user = await requireUser();
  const { order: id } = await searchParams;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await createClient();
  const { data: order, error } = await client!.from("orders").select("id,status,order_items(product_id,license_id)").eq("id", id).eq("user_id", user.id).single();
  if (error || !order) notFound();
  return <div className="page-width cart-page"><div className="page-intro">
    <span className="eyebrow">ORDER CONFIRMATION</span>
    <h1>{order.status === "paid" ? "Added to your library." : "Checking your payment."}</h1>
    <PurchaseStatus status={order.status} items={order.order_items.map(item => ({ beatId: item.product_id, licenseId: item.license_id }))} />
    <Link className="text-link" href="/library">Open My Library</Link>
  </div></div>;
}
