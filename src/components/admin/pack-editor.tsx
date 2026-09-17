"use client";
import { LoadingRing } from "@/components/ui/loading-indicators";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { savePack, preparePackUpload } from "@/app/admin/actions";
import type { PackEditorValue } from "@/types/managed-pack";
import { ProducerHack } from "@/components/producers/producer-hack";
import type { Producer } from "@/types/producer";

export function PackEditor({ initial }: { initial: PackEditorValue }) {
  const router = useRouter();
  const [pack, setPack] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const busy = pending || uploading;
  function update(patch: Partial<PackEditorValue>) {
    setPreview(false);
    setPack((p) => ({ ...p, ...patch }));
    setDirty(true);
    setMessage("");
  }
  function detail(patch: Partial<PackEditorValue["details"]>) {
    update({ details: { ...pack.details, ...patch } });
  }
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function upload(
    file: File | undefined,
    kind: string,
    done: (url: string, size: number, path: string, bucket: string) => void,
  ) {
    if (!file) return;
    setUploading(true);
    setError(false);
    setMessage(`Uploading ${file.name}… Keep this page open.`);
    try {
      const result = await preparePackUpload(kind, file.name, file.size);
      if (result.error || !result.bucket || !result.path || !result.token)
        throw new Error(result.error || "Upload could not start.");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const contentType =
        kind === "audio"
          ? "audio/mpeg"
          : kind === "image"
            ? `image/${file.name.toLowerCase().endsWith(".jpg") ? "jpeg" : file.name.split(".").pop()?.toLowerCase()}`
            : "application/zip";
      const sent = await client.storage
        .from(result.bucket)
        .uploadToSignedUrl(result.path, result.token, file, {
          contentType,
          upsert: false,
        });
      if (sent.error)
        throw new Error(
          "Upload failed. Check the file size and storage limit, then retry.",
        );
      done(result.publicUrl ?? "", file.size, result.path, result.bucket);
      setMessage("Upload complete. Save the pack to keep this change.");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }
  const producer: Producer = {
    id: pack.id,
    slug: pack.id,
    name: pack.producer,
    archiveNumber: pack.details.catalogNumber,
    image: pack.details.artistImage || pack.details.cover,
    role: pack.details.artistRole,
    location: "",
    bio: pack.details.artistBio || pack.details.description,
    voteGoal: 1,
    packs: [
      {
        id: pack.id,
        slug: pack.slug,
        title: pack.title,
        catalogNumber: pack.details.catalogNumber,
        description: pack.details.description,
        format: pack.details.format,
        cover: pack.details.cover,
        price: Number(pack.price) || 0,
        tracks: pack.details.tracks,
        locked: pack.details.locked,
      },
    ],
  };
  const field = (
    label: string,
    key: "title" | "producer" | "slug" | "price" | "licenseName",
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label>
      {label}
      <input
        value={pack[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        required
        {...extra}
      />
    </label>
  );
  return (
    <>
      <form
        className="pack-admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(false);
          setMessage("");
          startTransition(async () => {
            try {
              const result = await savePack(pack);
              if (result.error) {
                setError(true);
                setMessage(result.error);
              } else {
                setPack((p) => ({ ...p, revision: result.revision! }));
                setDirty(false);
                setMessage("Pack saved.");
                if (!initial.id) router.replace(`/admin/packs/${pack.id}`);
              }
            } catch {
              setError(true);
              setMessage(
                "Save interrupted. Your edits are still here. Please retry.",
              );
            }
          });
        }}
      >
        <fieldset disabled={busy}>
          <legend>Pack details</legend>
          <div className="pack-admin-grid">
            <label>
              Pack ID
              <input
                value={pack.id}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                readOnly={pack.revision > 0 || Boolean(initial.id)}
                onChange={(e) =>
                  update({ id: e.target.value, slug: e.target.value })
                }
              />
            </label>
            {field("URL slug", "slug", {
              readOnly: pack.revision > 0 || Boolean(initial.id),
              pattern: "[a-z0-9]+(-[a-z0-9]+)*",
              maxLength: 80,
            })}
            {field("Pack title", "title", { maxLength: 160 })}
            {field("Producer", "producer", { maxLength: 120 })}
            {field("Price (USD)", "price", {
              inputMode: "decimal",
              pattern: "[0-9]+(\\.[0-9]{1,2})?",
              minLength: 1,
            })}
            <label>
              File format
              <input
                required
                value={pack.details.format}
                onChange={(e) => detail({ format: e.target.value })}
              />
            </label>
            <label>
              Catalog number
              <input
                required
                value={pack.details.catalogNumber}
                onChange={(e) => detail({ catalogNumber: e.target.value })}
              />
            </label>
            <label>
              Display order
              <input
                type="number"
                min={-10000}
                max={10000}
                value={pack.sortOrder}
                onChange={(e) => update({ sortOrder: Number(e.target.value) })}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              maxLength={2000}
              value={pack.details.description}
              onChange={(e) => detail({ description: e.target.value })}
            />
          </label>
          <label className="pack-admin-check">
            <input
              type="checkbox"
              checked={pack.details.locked}
              onChange={(e) => detail({ locked: e.target.checked })}
            />
            Locked — visitors vote to hack before opening previews.
          </label>
          <p className="pack-admin-help">
            Unlocked packs open immediately. Both still require purchase for
            private downloads.
          </p>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Artwork and featured artist</legend>
          <div className="pack-admin-grid">
            <label>
              Pack cover
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  void upload(e.target.files?.[0], "image", (url) =>
                    detail({ cover: url }),
                  )
                }
              />
              {pack.details.cover && <span>Cover uploaded</span>}
            </label>
            <label>
              Artist photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  void upload(e.target.files?.[0], "image", (url) =>
                    detail({ artistImage: url }),
                  )
                }
              />
              {pack.details.artistImage && <span>Photo uploaded</span>}
            </label>
            <label>
              Artist role
              <input
                value={pack.details.artistRole}
                onChange={(e) => detail({ artistRole: e.target.value })}
              />
            </label>
          </div>
          <label>
            Artist biography
            <textarea
              value={pack.details.artistBio}
              maxLength={2000}
              onChange={(e) => detail({ artistBio: e.target.value })}
            />
          </label>
          <p className="pack-admin-help">
            Artwork and audio previews are public. Upload only the excerpts
            visitors should hear.
          </p>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Audio previews</legend>
          <p className="pack-admin-help">
            Add at least two tracks to publish. Duration is the full file
            length; preview duration is the uploaded excerpt length, in seconds.
          </p>
          {pack.details.tracks.map((track, index) => (
            <div className="pack-admin-track" key={track.id}>
              <div className="pack-admin-grid">
                <label>
                  Track {index + 1} title
                  <input
                    required
                    value={track.title}
                    onChange={(e) =>
                      detail({
                        tracks: pack.details.tracks.map((t, i) =>
                          i === index ? { ...t, title: e.target.value } : t,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Duration (seconds)
                  <input
                    type="number"
                    min={1}
                    max={86400}
                    required
                    value={track.duration}
                    onChange={(e) =>
                      detail({
                        tracks: pack.details.tracks.map((t, i) =>
                          i === index
                            ? { ...t, duration: Number(e.target.value) }
                            : t,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Preview duration
                  <input
                    type="number"
                    min={1}
                    value={track.previewDuration ?? track.duration}
                    onChange={(e) =>
                      detail({
                        tracks: pack.details.tracks.map((t, i) =>
                          i === index
                            ? { ...t, previewDuration: Number(e.target.value) }
                            : t,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  BPM (optional)
                  <input
                    type="number"
                    min={1}
                    max={400}
                    value={track.bpm ?? ""}
                    onChange={(e) =>
                      detail({
                        tracks: pack.details.tracks.map((t, i) =>
                          i === index
                            ? {
                                ...t,
                                bpm: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              }
                            : t,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Key (optional)
                  <input
                    maxLength={40}
                    value={track.key ?? ""}
                    onChange={(e) =>
                      detail({
                        tracks: pack.details.tracks.map((t, i) =>
                          i === index
                            ? { ...t, key: e.target.value || null }
                            : t,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  MP3 preview
                  <input
                    type="file"
                    accept="audio/mpeg,.mp3"
                    onChange={(e) =>
                      void upload(e.target.files?.[0], "audio", (url) =>
                        detail({
                          tracks: pack.details.tracks.map((t, i) =>
                            i === index ? { ...t, previewUrl: url } : t,
                          ),
                        }),
                      )
                    }
                  />
                </label>
              </div>
              {track.previewUrl && (
                <audio
                  controls
                  preload="none"
                  src={track.previewUrl}
                  aria-label={`${track.title} preview`}
                />
              )}
              <button
                type="button"
                onClick={() =>
                  detail({
                    tracks: pack.details.tracks.filter((_, i) => i !== index),
                  })
                }
              >
                Remove track {index + 1}
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={pack.details.tracks.length >= 200}
            onClick={() =>
              detail({
                tracks: [
                  ...pack.details.tracks,
                  {
                    id: crypto.randomUUID(),
                    title: "",
                    genre: "WAV audio",
                    bpm: null,
                    key: null,
                    duration: 60,
                    previewDuration: 15,
                    previewUrl: "",
                  },
                ],
              })
            }
          >
            Add preview track
          </button>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>License and private downloads</legend>
          {field("License name", "licenseName")}
          <label>
            License terms
            <textarea
              rows={8}
              maxLength={20000}
              value={pack.licenseTerms}
              onChange={(e) => update({ licenseTerms: e.target.value })}
            />
          </label>
          <p className="pack-admin-help">
            License text is saved with each purchase and supplied as its license
            download. Existing buyers keep their original terms. Saved ZIPs
            cannot be replaced here; create a new pack version for a different
            release.
          </p>
          <div className="pack-admin-grid">
            {(["test", "release"] as const).map((kind) => {
              const bucket =
                kind === "test" ? "lost-files-demo" : "lost-files-releases";
              const file = pack.files.find((f) => f.bucket === bucket);
              return (
                <label key={kind}>
                  {kind === "test" ? "Test ZIP" : "Real release ZIP"}
                  {file ? (
                    <span>
                      {file.download_name} (
                      {(file.size_bytes / 1048576).toFixed(1)} MB)
                    </span>
                  ) : (
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void upload(file, kind, (_, size, path) =>
                          update({
                            files: [
                              ...pack.files,
                              {
                                bucket,
                                object_key: path,
                                download_name: file!.name.replace(
                                  /[^a-zA-Z0-9 _.,()-]/g,
                                  "-",
                                ),
                                size_bytes: size,
                              },
                            ],
                          }),
                        );
                      }}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Publication</legend>
          <label>
            Status
            <select
              value={pack.status}
              onChange={(e) =>
                update({
                  status: e.target.value as PackEditorValue["status"],
                  liveReady: false,
                  featured: e.target.value === "draft" ? false : pack.featured,
                })
              }
            >
              <option value="draft">
                Draft — hidden / unavailable for new purchases
              </option>
              <option value="testers">
                Public preview — approved testers can buy in test mode
              </option>
              <option value="published">
                Published — available in the configured payment mode
              </option>
            </select>
          </label>
          <label className="pack-admin-check">
            <input
              type="checkbox"
              checked={pack.featured}
              disabled={pack.status === "draft"}
              onChange={(e) => update({ featured: e.target.checked })}
            />
            Feature on homepage (replaces the current featured pack)
          </label>
          <label className="pack-admin-check">
            <input
              type="checkbox"
              checked={pack.liveReady}
              disabled={pack.status !== "published"}
              onChange={(e) => update({ liveReady: e.target.checked })}
            />
            Ready for real sales — release ZIP, selling rights, and license
            approved
          </label>
          <p className="pack-admin-help">
            This does not turn on live payments. Tester permissions stay managed
            in the existing tester list. Unpublishing preserves purchase history
            and downloads.
          </p>
        </fieldset>
        <div className="pack-admin-actions">
          <button type="submit" disabled={busy} aria-busy={pending}>
            {pending && <LoadingRing />}
            {pending ? "Saving…" : "Save pack"}
          </button>
          <button
            type="button"
            disabled={
              busy || !pack.details.tracks.length || !pack.details.cover
            }
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Hide preview" : "Preview pack"}
          </button>
          <span>{dirty ? "Unsaved changes" : ""}</span>
        </div>
        <p role={error ? "alert" : "status"} aria-live="polite">
          {message}
        </p>
      </form>
      {preview && (
        <section className="pack-admin-preview" aria-label="Pack preview">
          <p>Unsaved preview — purchasing is disabled.</p>
          <ProducerHack
            key={`${pack.id}-${pack.details.locked}`}
            producer={producer}
            purchasedPackIds={[]}
            previewOnly
          />
        </section>
      )}
    </>
  );
}
