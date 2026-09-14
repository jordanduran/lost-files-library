import {
  findDeliveryOrder,
  hasDeliveryAccess,
  deliveryTarget,
} from "@/lib/order-delivery";
import { adminDatabase } from "@/lib/supabase/admin";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
async function download(
  request: Request,
  {
    params,
  }: { params: Promise<{ token: string; itemId: string; fileId: string }> },
) {
  if (
    request.method === "POST" &&
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response("Forbidden", { status: 403, headers });
  const { token, itemId, fileId } = await params;
  try {
    const order = await findDeliveryOrder(token);
    const item = order?.order_items.find((item) => item.id === itemId);
    if (!order || !item)
      return new Response("Download not found", { status: 404, headers });
    if (!deliveryTarget(token, itemId, fileId).startsWith("/api/delivery/"))
      return new Response("Download not found", { status: 404, headers });
    if (!(await hasDeliveryAccess(order))) {
      const verificationUrl = `/downloads/${token}?item=${encodeURIComponent(itemId)}&file=${encodeURIComponent(fileId)}`;
      if (request.headers.get("accept")?.includes("application/json"))
        return Response.json({ url: verificationUrl }, { headers });
      return new Response(null, {
        status: 303,
        headers: {
          ...headers,
          Location: `/downloads/${token}?item=${encodeURIComponent(itemId)}&file=${encodeURIComponent(fileId)}`,
        },
      });
    }
    if (fileId === "license") {
      const license = `LOST FILES LIBRARY\n${order.is_test ? "TEST PURCHASE — DEMO LICENSE\n" : ""}\nOrder: ${order.id}\nPurchased: ${order.paid_at}\nPack: ${item.product_title}\nLicense: ${item.license_name}\n\n${item.license_terms}\n`;
      return new Response(license, {
        headers: {
          ...headers,
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="Lost-Files-License.txt"',
        },
      });
    }
    if (fileId !== "zip" && !/^[0-9a-f-]{36}$/i.test(fileId))
      return new Response("Download not found", { status: 404, headers });
    const db = adminDatabase();
    let query = db
      .from("product_files")
      .select("bucket,object_key,download_name")
      .eq("product_id", item.product_id)
      .eq("license_id", item.license_id)
      .eq("storage_provider", "supabase")
      .eq("bucket", process.env.DOWNLOAD_BUCKET || "lost-files-demo")
      .eq("content_type", "application/zip");
    if (fileId !== "zip") query = query.eq("id", fileId);
    const { data: file, error } = await query.order("id").limit(1).single();
    if (error || !file)
      return new Response("Download not found", { status: 404, headers });
    const { data: bucket, error: bucketError } = await db.storage.getBucket(
      file.bucket,
    );
    if (bucketError || !bucket || bucket.public)
      throw new Error("Private storage required");
    const { data, error: signingError } = await db.storage
      .from(file.bucket)
      .createSignedUrl(file.object_key, 60, { download: file.download_name });
    if (signingError || !data) throw new Error("Download unavailable");
    if (request.headers.get("accept")?.includes("application/json"))
      return Response.json({ url: data.signedUrl }, { headers });
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: data.signedUrl },
    });
  } catch {
    return new Response(
      "Download temporarily unavailable. Return to your download window and try again.",
      { status: 503, headers },
    );
  }
}
export const GET = download;
export const POST = download;
