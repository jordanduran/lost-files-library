import type { Beat } from "@/types/beat";
const tracks = [
  [
    "Midnight Drive",
    "Jordan",
    "Trap",
    ["Dark", "Melodic"],
    142,
    "F#m",
    161,
    29,
    "midnight",
  ],
  [
    "Concrete Dreams",
    "Milo",
    "Trap",
    ["Dark"],
    142,
    "F#m",
    161,
    29,
    "concrete",
  ],
  ["Velvet Skyline", "Avery", "R&B", ["Smooth"], 98, "Cm", 192, 29, "velvet"],
  ["Last Call", "Jordan", "Hip Hop", ["Chill"], 84, "Gm", 178, 29, "lastcall"],
  ["Paper Planes", "Milo", "Trap", ["Melodic"], 160, "Dm", 201, 29, "paper"],
  ["Solar", "Avery", "Ambient", ["Cinematic"], 120, "Am", 156, 29, "solar"],
  ["After Hours", "Jordan", "R&B", ["Moody"], 96, "C#m", 184, 39, "hours"],
  ["No Signal", "Milo", "Hip Hop", ["Dark"], 138, "Em", 169, 29, "signal"],
] as const;
export const beats: Beat[] = tracks.map(
  (
    [title, producer, genre, mood, bpm, key, duration, startingPrice, artwork],
    index,
  ) => ({
    id: `beat-${index + 1}`,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    title,
    producer,
    genre,
    mood: [...mood],
    bpm,
    key,
    duration,
    startingPrice,
    artwork,
    popularity: [98, 83, 95, 70, 86, 78, 94, 90][index],
    licenses: [
      {
        id: "mp3",
        name: "MP3 License",
        price: startingPrice,
        description: "For your next idea.",
        includes: ["MP3 file", "Personal / demo use"],
      },
      {
        id: "wav",
        name: "WAV License",
        price: startingPrice + 20,
        description: "Ready for release.",
        includes: ["High-quality WAV", "Commercial release"],
      },
      {
        id: "stems",
        name: "WAV + Stems",
        price: startingPrice + 70,
        description: "Make it your own.",
        includes: ["WAV", "Track stems", "Expanded usage"],
      },
    ],
  }),
);
export const featuredBeats = [beats[0], beats[1], beats[2], beats[7], beats[6]];
export function getBeat(id: string) {
  return beats.find((beat) => beat.id === id);
}
