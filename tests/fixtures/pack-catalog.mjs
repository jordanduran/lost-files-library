import { producers } from "../../src/data/producers.ts";
import { storePacks } from "../../src/data/store-packs.ts";
import { beats } from "../../src/data/mock-beats.ts";
export function fixturePacks() {
  const artist = producers[0],
    pack = artist.packs[0];
  return [
    {
      id: pack.id,
      slug: pack.slug,
      title: pack.title,
      producer: artist.name,
      kind: "pack",
      published: true,
      test_restricted: false,
      live_ready: false,
      pack_tracks: pack.tracks.map((t) => t.id),
      pack_listings: {
        featured: true,
        sort_order: 0,
        revision: 1,
        details: {
          description: pack.description,
          artistImage: artist.image,
          artistBio: artist.bio,
          artistRole: artist.role,
          cover: pack.cover,
          format: pack.format,
          catalogNumber: pack.catalogNumber,
          locked: true,
          tracks: pack.tracks,
        },
      },
      product_licenses: [
        {
          id: "pack",
          name: "Pack License",
          description: "Fixture license",
          includes: ["ZIP", "License"],
          price_cents: 4900,
        },
      ],
    },
    ...storePacks.map((p, index) => ({
      id: p.id,
      slug: p.id,
      title: p.title,
      producer: p.producer,
      kind: "pack",
      published: true,
      test_restricted: false,
      live_ready: false,
      pack_tracks: p.trackIds,
      pack_listings: {
        featured: false,
        sort_order: index + 1,
        revision: 1,
        details: {
          description: p.description,
          artistImage: artist.image,
          artistBio: "Fixture artist",
          artistRole: "Producer",
          cover: pack.cover,
          format: p.format,
          catalogNumber: p.id,
          locked: false,
          tracks: p.trackIds
            .map((id) => beats.find((t) => t.id === id))
            .map((t) => ({
              id: t.id,
              title: t.title,
              genre: t.genre,
              bpm: t.bpm,
              key: t.key,
              duration: t.duration,
              previewDuration: 15,
              previewUrl: t.previewUrl,
            })),
        },
      },
      product_licenses: [
        {
          id: "pack",
          name: "Pack License",
          description: "Fixture license",
          includes: ["ZIP", "License"],
          price_cents: p.price * 100,
        },
      ],
    })),
  ];
}
