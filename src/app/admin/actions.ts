"use server";
import { randomUUID } from "node:crypto";
import { producers } from "@/data/producers";
import { beats } from "@/data/mock-beats";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/managed-packs";
import { adminDatabase } from "@/lib/supabase/admin";
import { validatePack } from "@/lib/pack-validation";
import type { PackEditorValue } from "@/types/managed-pack";

// Existing bundled assets remain valid when imported packs are edited. New
// assets use verified storage uploads; never stat public/ inside a serverless function.
const bundledAssets = new Set([
  ...producers.flatMap((p) => [
    p.image,
    ...p.packs.flatMap((pack) => [
      pack.cover,
      ...pack.tracks.map((t) => t.previewUrl),
    ]),
  ]),
  ...beats.map((t) => t.previewUrl),
]);

export async function savePack(
  value: PackEditorValue,
): Promise<{ error?: string; revision?: number }> {
  await requireAdmin();
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
    const validation = validatePack(value, origin);
    if (validation) return { error: validation };
    const db = adminDatabase();
    const assetUrls = [
      value.details.cover,
      value.details.artistImage,
      ...value.details.tracks.map((t) => t.previewUrl),
    ].filter(Boolean);
    for (const url of assetUrls.filter((u) => u.startsWith("/"))) {
      if (!bundledAssets.has(url)) {
        return {
          error:
            "An artwork or preview file is missing. Upload the missing asset.",
        };
      }
    }
    // Check actual storage objects, not client-supplied sizes or URLs.
    for (const f of value.files) {
      const bucket = await db.storage.getBucket(f.bucket);
      if (bucket.error || bucket.data.public)
        return {
          error:
            "Download buckets must be private before this pack can be saved.",
        };
      const result = await db.storage.from(f.bucket).info(f.object_key);
      if (
        result.error ||
        !result.data ||
        result.data.size !== f.size_bytes ||
        !["application/zip", "application/x-zip-compressed"].includes(
          result.data.contentType ?? "",
        )
      )
        return {
          error: `The ${f.bucket === "lost-files-demo" ? "test" : "release"} ZIP could not be verified. Upload it again.`,
        };
    }
    const publicAssets = [
      value.details.cover,
      value.details.artistImage,
      ...value.details.tracks.map((t) => t.previewUrl),
    ].filter((u) => u.startsWith(origin));
    for (const url of publicAssets) {
      const path = new URL(url).pathname.split("/pack-assets/")[1];
      const result = await db.storage
        .from("pack-assets")
        .info(decodeURIComponent(path));
      if (result.error || !result.data)
        return {
          error:
            "An artwork or preview upload is missing. Upload it again before saving.",
        };
    }
    const result = await db.rpc("save_managed_pack", {
      p: { ...value, priceCents: Math.round(Number(value.price) * 100) },
    });
    if (result.error) {
      const message = result.error.message;
      if (
        message.includes("changed. Reload") ||
        message.includes("saved ZIP cannot") ||
        message.includes("URL cannot")
      )
        return { error: message };
      if (result.error.code === "23505")
        return {
          error: "That pack ID or URL is already used. Choose another.",
        };
      console.error("pack_save_failed", { code: result.error.code });
      return {
        error:
          "The pack could not be saved. Your edits are still here; try again.",
      };
    }
    revalidatePath("/", "layout");
    return { revision: result.data as number };
  } catch {
    return {
      error:
        "The catalog or storage service is unavailable. Your edits are still here; try again.",
    };
  }
}

export async function preparePackUpload(
  kind: string,
  name: string,
  size: number,
): Promise<{
  error?: string;
  bucket?: string;
  path?: string;
  token?: string;
  publicUrl?: string;
}> {
  await requireAdmin();
  if (typeof kind !== "string" || typeof name !== "string" || name.length > 255)
    return { error: "Invalid upload filename." };
  const extension = name.split(".").pop()?.toLowerCase();
  const allowed =
    kind === "image"
      ? ["png", "jpg", "jpeg", "webp"]
      : kind === "audio"
        ? ["mp3"]
        : ["zip"];
  const limit =
    kind === "image"
      ? 10 * 1024 * 1024
      : kind === "audio"
        ? 30 * 1024 * 1024
        : 1024 * 1024 * 1024;
  if (
    !["image", "audio", "test", "release"].includes(kind) ||
    !extension ||
    !allowed.includes(extension) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > limit
  )
    return {
      error:
        "Unsupported file type or size. Artwork: PNG/JPG/WebP up to 10 MB; previews: MP3 up to 30 MB; ZIPs: up to 1 GB (subject to storage plan limits).",
    };
  try {
    const bucket =
      kind === "test"
        ? "lost-files-demo"
        : kind === "release"
          ? "lost-files-releases"
          : "pack-assets";
    const path = `uploads/${randomUUID()}.${extension}`;
    const db = adminDatabase();
    const result = await db.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: false });
    if (result.error)
      return {
        error:
          "Upload could not start. Check the storage bucket setup and try again.",
      };
    return {
      bucket,
      path,
      token: result.data.token,
      publicUrl:
        bucket === "pack-assets"
          ? db.storage.from(bucket).getPublicUrl(path).data.publicUrl
          : undefined,
    };
  } catch {
    return { error: "Storage is unavailable. Please try again." };
  }
}
