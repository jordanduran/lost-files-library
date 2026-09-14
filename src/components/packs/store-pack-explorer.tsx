"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { FileAudio, Pause, Play, ShoppingBag, X } from "lucide-react";
import { Notice } from "@/components/ui/notice";
import { getBeat } from "@/data/mock-beats";
import type { StorePack } from "@/data/store-packs";
import { usePlayer } from "@/stores/player-store";

function fileName(title: string) {
  return `${title.toUpperCase().replaceAll(" ", "_")}.WAV`;
}
function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function StorePackExplorer({
  pack,
  children,
}: {
  pack: StorePack;
  children: React.ReactNode;
}) {
  const player = usePlayer();
  const tracks = pack.trackIds.flatMap((id) => {
    const track = getBeat(id);
    return track ? [track] : [];
  });
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="pack-explorer-overlay" />
        <Dialog.Content
          className="pack-explorer-dialog"
          aria-describedby={undefined}
        >
          <div className="pack-explorer-window">
            <div className="pack-explorer-titlebar">
              <Dialog.Title>
                C:\LOST_FILES\OPEN_PACKS\
                {pack.title.toUpperCase().replaceAll(" ", "_")}
              </Dialog.Title>
              <Dialog.Close aria-label="Close pack">
                <X size={14} />
              </Dialog.Close>
            </div>
            <div className="pack-explorer-menu">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Play</span>
              <span>Help</span>
            </div>
            <div className="pack-explorer-address">
              Address&nbsp;&nbsp; C:\STORE\{pack.id.toUpperCase()}\AUDIO
            </div>
            <div className="pack-explorer-heading">
              <div>
                <span>OPEN PACK / NO HACK REQUIRED</span>
                <h2>{pack.title}</h2>
              </div>
              <strong>${pack.price}</strong>
            </div>
            <div className="pack-explorer-columns">
              <span>Name</span>
              <span>Genre</span>
              <span>BPM</span>
              <span>Length</span>
              <span>Preview</span>
            </div>
            <div className="pack-explorer-files">
              {tracks.map((track) => {
                const playing = player.trackId === track.id && player.isPlaying;
                return (
                  <button
                    className="pack-explorer-file"
                    key={track.id}
                    onClick={() => player.play(track.id)}
                  >
                    <span>
                      <FileAudio size={14} /> {fileName(track.title)}
                    </span>
                    <span>{track.genre}</span>
                    <span>{track.bpm}</span>
                    <span>{duration(track.duration)}</span>
                    <span>
                      {playing ? <Pause size={13} /> : <Play size={13} />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pack-explorer-status">
              <span>{tracks.length} object(s)</span>
              <span>{pack.format}</span>
            </div>
          </div>
          <footer className="pack-explorer-purchase">
            <p>
              <span>COMPLETE PACK</span>
              {tracks.length} preview beats / secure ZIP download
            </p>
            <Notice
              title="Pack checkout is coming next"
              description={`${pack.title} currently uses demo previews. Its $${pack.price} purchase will activate when the real ZIP and Supabase catalog record are connected.`}
            >
              <button>
                <ShoppingBag size={14} /> PURCHASE COMPLETE PACK / ${pack.price}
              </button>
            </Notice>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
