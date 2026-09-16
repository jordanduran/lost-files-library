import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { adminDatabase } from "./supabase/admin";
import { requireUser } from "./auth";
import { notFound } from "next/navigation";
import type {
  PackDetails,
  PackEditorValue,
  PublicPack,
} from "@/types/managed-pack";
import type { Producer } from "@/types/producer";

export async function requireAdmin() {
  const user = await requireUser();
  if (user.app_metadata.role !== "admin") notFound();
  return user;
}

type PackRow = {
  id: string;
  slug: string;
  title: string;
  producer: string;
  published: boolean;
  test_restricted: boolean;
  live_ready: boolean;
  pack_listings: {
    details: PackDetails;
    featured: boolean;
    sort_order: number;
    revision: number;
  } | null;
  product_licenses: {
    id: string;
    name: string;
    description: string;
    price_cents: number;
  }[];
};
const columns =
  "id,slug,title,producer,published,test_restricted,live_ready,pack_listings(details,featured,sort_order,revision),product_licenses(id,name,description,price_cents)";

export const publicPacks = cache(async (): Promise<PublicPack[]> => {
  // Read the current catalog at request time, never during deployment builds.
  await connection();
  const { data, error } = await adminDatabase()
    .from("products")
    .select(columns)
    .eq("kind", "pack")
    .or("published.eq.true,test_restricted.eq.true");
  if (error)
    throw new Error("The pack catalog could not be loaded. Please try again.");
  return (data as unknown as PackRow[])
    .filter(
      (p) => p.pack_listings && p.product_licenses.some((l) => l.id === "pack"),
    )
    .sort(
      (a, b) =>
        a.pack_listings!.sort_order - b.pack_listings!.sort_order ||
        a.title.localeCompare(b.title),
    )
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      producer: p.producer,
      price: p.product_licenses.find((l) => l.id === "pack")!.price_cents / 100,
      featured: p.pack_listings!.featured,
      details: p.pack_listings!.details,
    }));
});

export async function editorPacks(): Promise<PackEditorValue[]> {
  await requireAdmin();
  const db = adminDatabase();
  const { data, error } = await db
    .from("products")
    .select(columns)
    .eq("kind", "pack")
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      "Catalog unavailable. Check that the pack management migration has been applied.",
    );
  const files = await db
    .from("product_files")
    .select("product_id,bucket,object_key,download_name,size_bytes")
    .eq("license_id", "pack")
    .eq("content_type", "application/zip")
    .eq("storage_provider", "supabase");
  if (files.error) throw new Error("Unable to load private file references.");
  return (data as unknown as PackRow[]).map((p) => {
    const license = p.product_licenses.find((l) => l.id === "pack");
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      producer: p.producer,
      status: p.test_restricted
        ? "testers"
        : p.published
          ? "published"
          : "draft",
      liveReady: p.live_ready,
      featured: p.pack_listings?.featured ?? false,
      sortOrder: p.pack_listings?.sort_order ?? 0,
      price: ((license?.price_cents ?? 4900) / 100).toFixed(2),
      licenseName: license?.name ?? "Pack license",
      licenseTerms: license?.description ?? "",
      revision: p.pack_listings?.revision ?? 0,
      details: p.pack_listings?.details ?? emptyPack().details,
      files: (files.data ?? []).filter(
        (f) => f.product_id === p.id,
      ) as PackEditorValue["files"],
    };
  });
}

export function emptyPack(): PackEditorValue {
  return {
    id: "",
    slug: "",
    title: "",
    producer: "",
    status: "draft",
    liveReady: false,
    featured: false,
    sortOrder: 0,
    price: "49.00",
    licenseName: "Pack license",
    licenseTerms: "",
    revision: 0,
    files: [],
    details: {
      description: "",
      artistImage: "",
      artistBio: "",
      artistRole: "Producer",
      cover: "",
      format: "WAV",
      catalogNumber: "LFL-001",
      locked: false,
      tracks: [],
    },
  };
}

export function asProducer(p: PublicPack): Producer {
  return {
    id: p.id,
    slug: p.id,
    name: p.producer,
    archiveNumber: p.details.catalogNumber,
    image: p.details.artistImage || p.details.cover,
    role: p.details.artistRole,
    location: "",
    bio: p.details.artistBio || p.details.description,
    voteGoal: 1,
    packs: [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        catalogNumber: p.details.catalogNumber,
        description: p.details.description,
        format: p.details.format,
        cover: p.details.cover,
        price: p.price,
        tracks: p.details.tracks,
        locked: p.details.locked,
      },
    ],
  };
}
