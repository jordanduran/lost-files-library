export type ProducerTrack = {
  id: string;
  title: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  duration: number;
  previewUrl: string;
  previewDuration?: number;
};

export type ProducerPack = {
  locked?: boolean;
  id: string;
  slug: string;
  title: string;
  catalogNumber: string;
  description: string;
  format: string;
  cover?: string;
  price: number;
  tracks: ProducerTrack[];
};

export type Producer = {
  id: string;
  slug: string;
  name: string;
  archiveNumber: string;
  image: string;
  role: string;
  location: string;
  bio: string;
  voteGoal: number;
  packs: ProducerPack[];
};
