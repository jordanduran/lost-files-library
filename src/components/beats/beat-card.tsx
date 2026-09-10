import Link from "next/link";
import type { Beat } from "@/types/beat";
import { Artwork } from "./artwork";
import { PlayButton } from "@/components/audio/play-button";
export function BeatCard({ beat }: { beat: Beat }) {
  return (
    <article className="beat-card">
      <div className="card-art">
        <Link href={`/beats/${beat.slug}`} aria-label={`View ${beat.title}`}>
          <Artwork kind={beat.artwork} title={beat.title} />
        </Link>
        <span className="card-genre">{beat.genre}</span>
        <PlayButton id={beat.id} title={beat.title} />
      </div>
      <div className="card-info">
        <div>
          <Link href={`/beats/${beat.slug}`} className="card-title">
            {beat.title}
          </Link>
          <p>{beat.producer}</p>
        </div>
        <span>${beat.startingPrice}</span>
      </div>
      <div className="card-meta">
        {beat.bpm} BPM <span>·</span> {beat.key}
      </div>
    </article>
  );
}
