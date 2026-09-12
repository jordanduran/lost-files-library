export type LicenseOption = {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: string[];
};
export type Beat = {
  id: string;
  slug: string;
  title: string;
  producer: string;
  genre: string;
  mood: string[];
  bpm: number;
  key: string;
  duration: number;
  artwork: string;
  previewUrl?: string;
  previewDuration?: number;
  startingPrice: number;
  licenses: LicenseOption[];
  popularity: number;
};
