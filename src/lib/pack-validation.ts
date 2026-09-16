import type { PackEditorValue } from "../types/managed-pack";

export function validatePack(
  value: PackEditorValue,
  publicOrigin: string,
): string | null {
  const text = (s: unknown, max: number, required = true) =>
    typeof s === "string" &&
    s.length <= max &&
    (!required || s.trim().length > 0);
  const asset = (s: string) => {
    if (!s) return true;
    if (
      /^\/(?:packs|producers|audio)\/[a-zA-Z0-9/_.,-]+$/.test(s) &&
      !s.includes("..")
    )
      return true;
    try {
      const u = new URL(s);
      return (
        u.origin === publicOrigin &&
        !u.username &&
        !u.password &&
        u.pathname.startsWith("/storage/v1/object/public/pack-assets/") &&
        !u.search &&
        !u.hash
      );
    } catch {
      return false;
    }
  };
  if (
    !value ||
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value.id) ||
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value.slug)
  )
    return "Use lowercase letters, numbers, and hyphens for the ID and URL.";
  if (value.id === "new" || value.slug === "checkout")
    return "That ID or URL is reserved. Choose another.";
  if (!text(value.title, 160) || !text(value.producer, 120))
    return "Enter a title and producer name.";
  if (
    !/^(0|[1-9]\d{0,4})(\.\d{1,2})?$/.test(value.price) ||
    Number(value.price) < 0.5
  )
    return "Enter a USD price between $0.50 and $99,999.99. Free checkout is not supported.";
  if (
    !["draft", "testers", "published"].includes(value.status) ||
    typeof value.liveReady !== "boolean" ||
    typeof value.featured !== "boolean" ||
    !Number.isInteger(value.sortOrder) ||
    Math.abs(value.sortOrder) > 10000 ||
    !Number.isInteger(value.revision) ||
    value.revision < 0
  )
    return "Invalid publication settings.";
  if (value.liveReady && value.status !== "published")
    return "Only published packs can be ready for live sales.";
  if (value.featured && value.status === "draft")
    return "Publish the pack or enable tester previews before featuring it.";
  if (
    !text(value.licenseName, 160) ||
    !text(value.licenseTerms, 20000, value.status !== "draft")
  )
    return "Enter the license name and terms.";
  const d = value.details;
  if (
    !d ||
    typeof d.locked !== "boolean" ||
    !text(d.description, 2000, false) ||
    !text(d.artistBio, 2000, false) ||
    !text(d.artistRole, 120, false) ||
    !text(d.format, 160) ||
    !text(d.catalogNumber, 80) ||
    !text(d.cover, 1500, false) ||
    !text(d.artistImage, 1500, false) ||
    !asset(d.cover) ||
    !asset(d.artistImage) ||
    (d.cover !== "" && !/\.(png|jpe?g|webp)$/i.test(d.cover)) ||
    (d.artistImage !== "" && !/\.(png|jpe?g|webp)$/i.test(d.artistImage))
  )
    return "Check the pack details and uploaded artwork.";
  if (
    !Array.isArray(d.tracks) ||
    d.tracks.length > 200 ||
    new Set(d.tracks.map((t) => t.id)).size !== d.tracks.length
  )
    return "Use up to 200 unique preview tracks.";
  for (const t of d.tracks) {
    if (
      !/^[a-z0-9-]{1,120}$/.test(t.id) ||
      !text(t.title, 160) ||
      !text(t.genre, 100) ||
      !Number.isInteger(t.duration) ||
      t.duration < 1 ||
      t.duration > 86400 ||
      !text(t.previewUrl, 1500, false) ||
      !asset(t.previewUrl) ||
      (t.previewUrl !== "" &&
        !/\.mp3$/i.test(t.previewUrl) &&
        !/^\/audio\/demo\/[a-z0-9-]+\.wav$/.test(t.previewUrl)) ||
      (t.bpm !== null &&
        (!Number.isInteger(t.bpm) || t.bpm < 1 || t.bpm > 400)) ||
      (t.key !== null && !text(t.key, 40)) ||
      (t.previewDuration !== undefined &&
        (!Number.isFinite(t.previewDuration) ||
          t.previewDuration <= 0 ||
          t.previewDuration > t.duration))
    )
      return "Check each preview's title, audio URL, duration, BPM, and key.";
  }
  if (
    !Array.isArray(value.files) ||
    value.files.length > 2 ||
    new Set(value.files.map((f) => f.bucket)).size !== value.files.length
  )
    return "Keep one ZIP per payment mode.";
  for (const f of value.files) {
    if (
      !["lost-files-demo", "lost-files-releases"].includes(f.bucket) ||
      !text(f.object_key, 500) ||
      f.object_key.includes("..") ||
      !/^[a-zA-Z0-9/_.,-]+\.zip$/i.test(f.object_key) ||
      !/^[a-zA-Z0-9 _.,()-]+\.zip$/i.test(f.download_name) ||
      !Number.isSafeInteger(f.size_bytes) ||
      f.size_bytes <= 0
    )
      return "Invalid ZIP file. Upload it again.";
  }
  if (value.status !== "draft") {
    if (
      !d.cover ||
      !d.description ||
      d.tracks.length < 2 ||
      d.tracks.some((t) => !t.previewUrl)
    )
      return "Publishing requires artwork, a description, and at least two audio previews.";
    if (value.featured && (!d.artistImage || !d.artistBio))
      return "A featured pack needs an artist photo and biography.";
    if (
      !value.files.some(
        (f) =>
          f.bucket ===
          (value.liveReady ? "lost-files-releases" : "lost-files-demo"),
      )
    )
      return "Upload the ZIP for the selected payment mode before publishing.";
  }
  return null;
}
