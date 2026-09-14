export type ProducerTrack = {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  duration: number;
  previewUrl: string;
};

export type ProducerPack = {
  id: string;
  slug: string;
  title: string;
  catalogNumber: string;
  description: string;
  format: string;
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
