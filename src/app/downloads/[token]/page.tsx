import { DeliveryTitle } from "@/components/packs/delivery-title";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { findDeliveryOrder, hasDeliveryAccess } from "@/lib/order-delivery";
import { adminDatabase } from "@/lib/supabase/admin";
import { ClearPurchasedPacks } from "@/components/packs/clear-purchased-packs";
import "../downloads.css";
import { DownloadVerification } from "@/components/packs/download-verification";
import { DeliveryDownloadButton } from "@/components/packs/delivery-download-button";
import { getUser } from "@/lib/auth";
import { savePurchase } from "./actions";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your downloads",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Downloads({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ item?: string; file?: string }>;
}) {
  const { token } = await params;
  const order = await findDeliveryOrder(token);
  if (!order) notFound();
  const allowed = await hasDeliveryAccess(order);
  const target = await searchParams;
  const user = await getUser();
  if (!allowed)
    return (
      <div className="page-width delivery-page">
        <section className="delivery-window">
          <DeliveryTitle />
          <div className="delivery-body">
            <span className="eyebrow">PRIVATE DOWNLOADS</span>
            <h1>Verify your email.</h1>
            <DownloadVerification
              token={token}
              item={target.item}
              file={target.file}
            />
            <p>
              Already have an account?{" "}
              <a href={`/login?next=/downloads/${token}`}>Sign in</a>.
            </p>
          </div>
        </section>
      </div>
    );
  const items = await Promise.all(
    order.order_items.map(async (item) => {
      const { data: files, error } = await adminDatabase()
        .from("product_files")
        .select("id,download_name")
        .eq("product_id", item.product_id)
        .eq("license_id", item.license_id)
        .eq("storage_provider", "supabase")
        .eq("bucket", order.delivery_bucket)
        .eq("content_type", "application/zip");
      if (error)
        throw new Error(
          "Downloads are temporarily unavailable. Please try again.",
        );
      return { ...item, files: files ?? [] };
    }),
  );
  return (
    <div className="page-width delivery-page">
      <section className="delivery-window">
        <ClearPurchasedPacks packIds={items.map((item) => item.product_id)} />
        <DeliveryTitle />
        <div className="delivery-menu">File &nbsp; View &nbsp; Help</div>
        <div className="delivery-body">
          <div className="delivery-heading">
            <div>
              <span className="eyebrow">PAYMENT VERIFIED / ACCESS GRANTED</span>
              <h1>Your pack is ready.</h1>
            </div>
            <Image
              className="delivery-logo"
              src="/brand/lost-files-mark.webp"
              alt="Lost Files Library"
              width={48}
              height={48}
              unoptimized
            />
          </div>
          <p>
            Download the full collection and your purchase license. No sign-in
            needed.
          </p>
          {items.map((item) => (
            <article key={item.id} className="delivery-item">
              <h2>{item.product_title}</h2>
              <p>{item.license_name}</p>
              <div className="delivery-actions">
                {item.files.map((file) => (
                  <DeliveryDownloadButton
                    key={file.id}
                    href={`/api/delivery/${token}/${item.id}/${file.id}`}
                    label="↓ Download ZIP"
                  />
                ))}
                <form
                  method="post"
                  action={`/api/delivery/${token}/${item.id}/license`}
                >
                  <button className="delivery-button">
                    ↓ Download license
                  </button>
                </form>
              </div>
              {!item.files.length && (
                <p>
                  The ZIP is temporarily unavailable. Please return to this link
                  shortly.
                </p>
              )}
              <details>
                <summary>Read license terms</summary>
                <p>{item.license_terms}</p>
              </details>
            </article>
          ))}
          <p>
            Your files are private. Opening this link in a new browser may
            require an email code.
          </p>
          {!order.user_id &&
            (user?.email_confirmed_at &&
            user.email?.toLowerCase() ===
              order.checkout_email?.toLowerCase() ? (
              <form action={savePurchase}>
                <input type="hidden" name="token" value={token} />
                <button className="delivery-button">Save to My Library</button>
              </form>
            ) : (
              <p>
                <a href={`/login?next=/downloads/${token}`}>
                  Save your purchases in an account
                </a>{" "}
                (optional). Use your checkout email.
              </p>
            ))}
          {order.is_test && (
            <p className="delivery-note">
              TEST PURCHASE · No real money was charged.
            </p>
          )}
        </div>
        <div className="delivery-footer">
          {items.length} pack(s) · ZIP + LICENSE · LOST FILES LIBRARY
        </div>
      </section>
    </div>
  );
}
