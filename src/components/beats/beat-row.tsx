"use client";
import Link from "next/link";
import type { Beat } from "@/types/beat";
import { Artwork } from "./artwork";
import { PlayButton } from "@/components/audio/play-button";
import { Waveform } from "@/components/audio/waveform";
import { usePlayer } from "@/stores/player-store";
import { time } from "@/lib/utils";
import { AddToCart } from "./add-to-cart";
export function BeatRow({ beat, index }: { beat: Beat; index: number }) {
  const active = usePlayer((s) => s.trackId === beat.id && s.isPlaying);
  return (
    <div className={`beat-row ${active ? "row-active" : ""}`} role="row">
      <div className="row-track" role="cell">
        <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="row-art">
          <Artwork kind={beat.artwork} title={beat.title} />
          <PlayButton id={beat.id} title={beat.title} />
        </div>
        <div>
          <Link className="track-title" href={`/beats/${beat.slug}`}>
            {beat.title}
          </Link>
          <p>
            {beat.producer}
            <span className="mobile-track-meta">
              {" "}
              · {beat.bpm} BPM · {beat.key}
            </span>
          </p>
        </div>
      </div>
      <div className="row-genre" role="cell">
        {beat.genre}
        <p>{beat.mood.join(" / ")}</p>
      </div>
      <div className="row-wave" role="cell">
        <Waveform active={active} />
      </div>
      <span className="row-bpm" role="cell">
        {beat.bpm}
      </span>
      <span className="row-key" role="cell">
        {beat.key}
      </span>
      <span className="row-duration" role="cell">
        {time(beat.duration)}
      </span>
      <div className="row-price" role="cell">
        <span>${beat.startingPrice}</span>
        <AddToCart beatId={beat.id} />
      </div>
    </div>
  );
}
