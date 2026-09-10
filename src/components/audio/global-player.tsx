"use client";
import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { getBeat } from "@/data/mock-beats";
import { time } from "@/lib/utils";
import { Artwork } from "@/components/beats/artwork";
export function GlobalPlayer() {
  const {
    trackId,
    isPlaying,
    progress,
    volume,
    toggle,
    skip,
    seek,
    setVolume,
  } = usePlayer();
  const beat = getBeat(trackId)!;
  return (
    <aside
      className="global-player dark-theme"
      aria-label="Global preview player"
    >
      <div className="player-track">
        <Artwork kind={beat.artwork} title={beat.title} />
        <div>
          <Link href={`/beats/${beat.slug}`}>{beat.title}</Link>
          <p>
            {beat.producer} <span>· Visual demo</span>
          </p>
        </div>
      </div>
      <div className="player-transport">
        <div className="transport-buttons">
          <button aria-label="Previous track" onClick={() => skip(-1)}>
            <SkipBack size={16} />
          </button>
          <button
            className="player-toggle"
            aria-label={
              isPlaying ? "Pause visual preview" : "Start visual preview"
            }
            aria-pressed={isPlaying}
            onClick={toggle}
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>
          <button aria-label="Next track" onClick={() => skip(1)}>
            <SkipForward size={16} />
          </button>
        </div>
        <div className="player-progress">
          <span>{time(Math.floor((beat.duration * progress) / 100))}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Preview position (visual demo)"
          />
          <span>{time(beat.duration)}</span>
        </div>
      </div>
      <div className="player-volume">
        <span className="demo-label">PREVIEW DEMO</span>
        <button
          aria-label={volume ? "Mute" : "Unmute"}
          onClick={() => setVolume(volume ? 0 : 75)}
        >
          {volume ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <input
          aria-label="Preview volume (visual demo)"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </aside>
  );
}
