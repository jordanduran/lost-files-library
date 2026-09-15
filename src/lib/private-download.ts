import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type DownloadFile = {
  bucket: string;
  object_key: string;
  download_name: string;
};

// Call only after verifying purchase ownership and the order's delivery bucket.
export async function signPrivateDownload(
  db: SupabaseClient,
  file: DownloadFile,
) {
  const { data: bucket, error: bucketError } = await db.storage.getBucket(
    file.bucket,
  );
  if (bucketError || !bucket || bucket.public)
    throw new Error("Private storage required");
  const { data, error } = await db.storage
    .from(file.bucket)
    .createSignedUrl(file.object_key, 60, { download: file.download_name });
  if (error || !data) throw new Error("Download unavailable");
  return data.signedUrl;
}
