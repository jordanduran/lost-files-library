import "./mock-auth-service.mjs";
import { fixturePacks } from "./pack-catalog.mjs";
const original = globalThis.fetch;
const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const packs = fixturePacks();
// Exercise a preview ID that does not exist in the old bundled player catalog.
packs.find(
  (p) => p.id === "store-pack-001",
).pack_listings.details.tracks[0].id = "managed-only-preview";
const files = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.origin !== origin) return original(input, init);
  if (url.pathname === "/auth/v1/user") {
    const token = new Headers(init?.headers)
      .get("authorization")
      ?.replace("Bearer ", "");
    try {
      const claims = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
      return Response.json({
        id: claims.sub,
        email: "admin@example.test",
        email_confirmed_at: "2026-01-01T00:00:00Z",
        app_metadata: { role: claims.sub.endsWith("1") ? "admin" : "customer" },
        user_metadata: {},
        aud: "authenticated",
        role: "authenticated",
      });
    } catch {
      return Response.json({ message: "No session" }, { status: 401 });
    }
  }
  if (url.pathname === "/rest/v1/products") {
    let rows = packs;
    if (url.searchParams.has("or"))
      rows = rows.filter((p) => p.published || p.test_restricted);
    if (url.searchParams.get("published") === "eq.true")
      rows = rows.filter((p) => p.published);
    return Response.json(rows);
  }
  if (url.pathname === "/rest/v1/product_files") return Response.json(files);
  if (url.pathname.startsWith("/storage/v1/object/info/"))
    return Response.json({
      size: 100,
      content_type: "application/zip",
      name: "uploads/test.zip",
    });
  if (url.pathname.startsWith("/storage/v1/object/upload/sign/"))
    return Response.json({
      url: url.pathname.replace("/storage/v1", "") + "?token=fixture-upload",
    });
  if (url.pathname.startsWith("/storage/v1/bucket/"))
    return Response.json({ public: false });
  if (url.pathname === "/rest/v1/order_items") return Response.json([]);
  if (url.pathname === "/rest/v1/rpc/save_managed_pack") {
    const p = JSON.parse(init.body).p;
    const old = packs.find((row) => row.id === p.id);
    if (old && old.pack_listings.revision !== p.revision)
      return Response.json(
        { message: "This pack changed. Reload before saving." },
        { status: 409 },
      );
    if (p.featured)
      for (const row of packs)
        if (row.id !== p.id) row.pack_listings.featured = false;
    const row = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      producer: p.producer,
      kind: "pack",
      published: p.status === "published",
      test_restricted: p.status === "testers",
      live_ready: p.liveReady,
      pack_tracks: p.details.tracks.map((t) => t.title),
      pack_listings: {
        featured: p.featured,
        sort_order: p.sortOrder,
        revision: p.revision + 1,
        details: p.details,
      },
      product_licenses: [
        {
          id: "pack",
          name: p.licenseName,
          description: p.licenseTerms,
          price_cents: p.priceCents,
          includes: ["ZIP", "License"],
        },
      ],
    };
    if (old) Object.assign(old, row);
    else packs.push(row);
    for (const file of p.files)
      if (!files.some((f) => f.product_id === p.id && f.bucket === file.bucket))
        files.push({ ...file, product_id: p.id });
    return Response.json(p.revision + 1);
  }
  return original(input, init);
};
