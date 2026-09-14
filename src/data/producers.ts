import type { Producer } from "@/types/producer";

export const producers: Producer[] = [
  {
    id: "producer-001",
    slug: "allen-ritter",
    name: "Allen Ritter",
    archiveNumber: "001",
    image: "/producers/allen-ritter.png",
    role: "Producer / Songwriter",
    location: "New York",
    bio: "Unreleased textures, melodies, and drums recovered from the sessions that shaped a generation of records.",
    voteGoal: 1,
    packs: [
      {
        id: "pack-001",
        slug: "ritter-files-vol-1",
        title: "The Ritter Files Vol. 1",
        catalogNumber: "LFL-001",
        description: "A complete collection of late-night melodies, drums, and atmospheric compositions from Allen Ritter.",
        format: "WAV / 24 BIT / ZIP",
        price: 49,
        tracks: [
          { id: "beat-1", title: "Midnight Drive", genre: "Trap", bpm: 142, key: "F#m", duration: 161, previewUrl: "/audio/demo/beat-1.wav" },
          { id: "beat-2", title: "Concrete Dreams", genre: "Trap", bpm: 142, key: "F#m", duration: 161, previewUrl: "/audio/demo/beat-2.wav" },
          { id: "beat-3", title: "Velvet Skyline", genre: "R&B", bpm: 98, key: "Cm", duration: 192, previewUrl: "/audio/demo/beat-3.wav" },
          { id: "beat-4", title: "Last Call", genre: "Hip Hop", bpm: 84, key: "Gm", duration: 178, previewUrl: "/audio/demo/beat-4.wav" },
          { id: "beat-5", title: "Paper Planes", genre: "Trap", bpm: 160, key: "Dm", duration: 201, previewUrl: "/audio/demo/beat-5.wav" },
          { id: "beat-6", title: "Solar", genre: "Ambient", bpm: 120, key: "Am", duration: 156, previewUrl: "/audio/demo/beat-6.wav" },
        ],
      },
    ],
  },
];

export function getProducer(slug: string) {
  return producers.find((producer) => producer.slug === slug);
}
