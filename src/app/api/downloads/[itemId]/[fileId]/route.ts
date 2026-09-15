import { getUser } from "@/lib/auth";
import { purchasedFiles } from "@/lib/downloads";
import { adminDatabase } from "@/lib/supabase/admin";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
};
export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string; fileId: string }> },
) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  const user = await getUser();
  if (!user)
    return Response.json(
      { error: "Sign in required" },
      { status: 401, headers },
    );
  const { itemId, fileId } = await context.params;
  if (![itemId, fileId].every((id) => /^[0-9a-f-]{36}$/i.test(id)))
    return Response.json({ error: "Not found" }, { status: 404, headers });
  try {
    const purchase = await purchasedFiles(user.id, itemId);
    if (!purchase?.files.some((file) => file.id === fileId))
      return Response.json({ error: "Not found" }, { status: 404, headers });
    const db = adminDatabase();
    const { data: file, error } = await db
      .from("product_files")
      .select("bucket,object_key,download_name")
      .eq("id", fileId)
      .eq("storage_provider", "supabase")
      .eq("bucket", purchase.bucket)
      .single();
    if (error || !file) throw new Error("File unavailable");
    const { data: bucket, error: bucketError } = await db.storage.getBucket(
      file.bucket,
    );
    if (bucketError || !bucket || bucket.public)
      throw new Error("Private storage required");
    const { data, error: signingError } = await db.storage
      .from(file.bucket)
      .createSignedUrl(file.object_key, 60, { download: file.download_name });
    if (signingError || !data) throw new Error("File unavailable");
    return Response.json({ url: data.signedUrl }, { headers });
  } catch {
    return Response.json(
      { error: "Download unavailable" },
      { status: 503, headers },
    );
  }
}
