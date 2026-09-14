import { beats } from "@/data/mock-beats";
import { producers } from "@/data/producers";

const archivePreviews = producers.flatMap((producer) =>
  producer.packs.flatMap((pack) =>
    pack.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      producer: producer.name,
      duration: track.duration,
      previewDuration: track.previewDuration ?? track.duration,
      previewUrl: track.previewUrl,
      artwork: "paper",
      cover: pack.cover,
      synthetic: track.previewUrl.startsWith("/audio/demo/"),
      packId: pack.id,
    })),
  ),
);
const demoPreviews = beats.map((beat) => ({
  ...beat,
  cover: undefined as string | undefined,
  synthetic: true,
  packId: "demo",
}));
export const previewTracks = [
  ...archivePreviews,
  ...demoPreviews.filter(
    (beat) => !archivePreviews.some((track) => track.id === beat.id),
  ),
];
export function getPreviewTrack(id: string) {
  return previewTracks.find((track) => track.id === id);
}
export function previewQueue(id: string | null) {
  const current = id ? getPreviewTrack(id) : undefined;
  return previewTracks.filter(
    (track) => track.packId === (current?.packId ?? "demo"),
  );
}
