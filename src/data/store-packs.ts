export type StorePack = {
  id: string;
  title: string;
  producer: string;
  description: string;
  files: number;
  format: string;
  price: number;
  trackIds: string[];
  art: "signal" | "chrome" | "tape" | "vault" | "master" | "private";
};

export const storePacks: StorePack[] = [
  {
    id: "store-pack-001",
    title: "Night Shift Drums",
    producer: "Lost Files",
    description:
      "Knocking drums, clipped percussion, and after-hours rhythm loops.",
    files: 4,
    format: "WAV / 24 BIT",
    price: 29,
    art: "signal",
    trackIds: ["beat-1", "beat-2", "beat-7", "beat-8"],
  },
  {
    id: "store-pack-002",
    title: "Chrome Melodies",
    producer: "Archive Division",
    description:
      "Cold synth phrases, glassy keys, and processed melodic starters.",
    files: 4,
    format: "WAV / MIDI",
    price: 39,
    art: "chrome",
    trackIds: ["beat-3", "beat-5", "beat-6", "beat-7"],
  },
  {
    id: "store-pack-003",
    title: "Analog Evidence",
    producer: "Lost Files",
    description:
      "Tape-worn textures, one-shots, and imperfect loops recovered from the vault.",
    files: 4,
    format: "WAV / 24 BIT",
    price: 24,
    art: "tape",
    trackIds: ["beat-4", "beat-8", "beat-1", "beat-6"],
  },
];

export const premiumPacks: StorePack[] = [
  {
    id: "premium-pack-001",
    title: "Black Label 001",
    producer: "Private Archive",
    description: "Premium archive placeholder.",
    files: 64,
    format: "WAV / STEMS",
    price: 0,
    art: "vault",
    trackIds: [],
  },
  {
    id: "premium-pack-002",
    title: "Master Drive",
    producer: "Studio Sessions",
    description: "Premium archive placeholder.",
    files: 51,
    format: "WAV / MIDI / STEMS",
    price: 0,
    art: "master",
    trackIds: [],
  },
  {
    id: "premium-pack-003",
    title: "Private Press",
    producer: "Producer Edition",
    description: "Premium archive placeholder.",
    files: 73,
    format: "FULL SESSION",
    price: 0,
    art: "private",
    trackIds: [],
  },
];
