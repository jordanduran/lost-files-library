import type { ProducerTrack } from "./producer";

export type PackDetails = {
  description: string;
  artistImage: string;
  artistBio: string;
  artistRole: string;
  cover: string;
  format: string;
  catalogNumber: string;
  locked: boolean;
  tracks: ProducerTrack[];
};
export type PackFile = {
  bucket: "lost-files-demo" | "lost-files-releases";
  object_key: string;
  download_name: string;
  size_bytes: number;
};
export type PackEditorValue = {
  id: string;
  slug: string;
  title: string;
  producer: string;
  status: "draft" | "testers" | "published";
  liveReady: boolean;
  featured: boolean;
  sortOrder: number;
  price: string;
  licenseName: string;
  licenseTerms: string;
  details: PackDetails;
  files: PackFile[];
  revision: number;
};
export type PublicPack = {
  id: string;
  slug: string;
  title: string;
  producer: string;
  price: number;
  featured: boolean;
  details: PackDetails;
};
