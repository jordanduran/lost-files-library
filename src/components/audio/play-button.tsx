"use client";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { cn } from "@/lib/utils";
export function PlayButton({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const trackId = usePlayer((s) => s.trackId);
  const playing = usePlayer((s) => s.isPlaying);
  const play = usePlayer((s) => s.play);
  const active = trackId === id && playing;
  return (
    <button
      aria-label={`${active ? "Pause" : "Preview"} ${title} (visual demo)`}
      aria-pressed={active}
      onClick={() => play(id)}
      className={cn("play-button", className)}
    >
      {active ? (
        <Pause size={17} fill="currentColor" />
      ) : (
        <Play size={17} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
}
