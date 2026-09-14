"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { getPreviewTrack } from "@/data/preview-tracks";
import Image from "next/image";
import { time } from "@/lib/utils";
import { Artwork } from "@/components/beats/artwork";
export function GlobalPlayer({ hidden = false }: { hidden?: boolean }) {
  const {
    trackId,
    isPlaying,
    progress,
    volume,
    toggle,
    skip,
    seek,
    setVolume,
    close,
    pause,
  } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState("");
  const beat = trackId ? getPreviewTrack(trackId) : undefined;
  const duration = beat?.previewDuration ?? beat?.duration ?? 0;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let canceled = false;
    if (trackId && isPlaying && !hidden) {
      void audio.play().catch((error: Error) => {
        if (canceled || error.name === "AbortError") return;
        setAudioError("Audio couldn't play. Press play to retry.");
        pause();
      });
    } else audio.pause();
    return () => {
      canceled = true;
      audio.pause();
    };
  }, [trackId, isPlaying, hidden, pause]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);
  return (
    <>
      <audio
        ref={audioRef}
        src={beat?.previewUrl}
        preload="metadata"
        onLoadStart={() => setAudioError("")}
        onPlaying={() => setAudioError("")}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration) && audio.duration > 0)
            seek((audio.currentTime / audio.duration) * 100);
        }}
        onEnded={close}
        onError={() => {
          if (trackId) {
            setAudioError("This preview is unavailable. Try another track.");
            pause();
          }
        }}
      />
      {beat && !hidden && (
        <aside
          className="global-player dark-theme"
          aria-label="Global preview player"
        >
          <div className="player-track">
            {beat.cover ? (
              <Image
                src={beat.cover}
                alt={`${beat.title} pack cover`}
                width={44}
                height={44}
              />
            ) : (
              <Artwork kind={beat.artwork} title={beat.title} />
            )}
            <div>
              <Link href="/producers/allen-ritter">{beat.title}</Link>
              <p>
                {beat.producer}{" "}
                <span>
                  · {beat.synthetic ? "Synthetic demo" : "15-second preview"}
                </span>
              </p>
              {audioError && <p role="alert">{audioError}</p>}
            </div>
          </div>
          <div className="player-transport">
            <div className="transport-buttons">
              <button aria-label="Previous track" onClick={() => skip(-1)}>
                <SkipBack size={16} />
              </button>
              <button
                className="player-toggle"
                aria-label={isPlaying ? "Pause preview" : "Start preview"}
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
              <span>{time(Math.floor((duration * progress) / 100))}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const audio = audioRef.current;
                  if (audio && Number.isFinite(audio.duration))
                    audio.currentTime = (audio.duration * value) / 100;
                  seek(value);
                }}
                aria-label="Preview position"
              />
              <span>{time(duration)}</span>
            </div>
          </div>
          <div className="player-volume">
            <span className="demo-label">
              {beat.synthetic ? "PREVIEW DEMO" : "PACK PREVIEW"}
            </span>
            <button
              aria-label={volume ? "Mute" : "Unmute"}
              onClick={() => setVolume(volume ? 0 : 75)}
            >
              {volume ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <input
              aria-label="Preview volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
          <button
            type="button"
            className="player-close"
            aria-label="Close preview player"
            onClick={close}
          >
            <X size={18} />
          </button>
        </aside>
      )}
    </>
  );
}
