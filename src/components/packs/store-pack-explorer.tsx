"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { usePack } from "@/stores/pack-store";
import Link from "next/link";
import { Check, FileAudio, Pause, Play, ShoppingBag, X } from "lucide-react";
import { getBeat } from "@/data/mock-beats";
import type { StorePack } from "@/data/store-packs";
import { usePlayer } from "@/stores/player-store";
import { usePackCart } from "@/stores/pack-cart-store";
import { useCompactWindow } from "./use-compact-window";
import {
  UnlockFeedback,
  UnlockOrbit,
  useUnlockFeedback,
} from "./unlock-feedback";

function fileName(title: string) {
  return `${title.toUpperCase().replaceAll(" ", "_")}.WAV`;
}
function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function StorePackExplorer({
  pack,
  purchased,
  children,
  open,
  onOpenChange,
}: {
  pack: StorePack;
  purchased: boolean;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const player = usePlayer();
  const [recentUnlock, showUnlock] = useUnlockFeedback();
  const { unlockedProducers, unlock } = usePack();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() =>
      setHydrated(true),
    );
  }, []);
  const unlocked =
    !pack.locked ||
    purchased ||
    (hydrated && unlockedProducers.includes(pack.id));
  const compactWindow = useCompactWindow();
  const inCart = usePackCart((state) =>
    state.items.some((item) => item.packId === pack.id),
  );
  const add = usePackCart((state) => state.add);
  const tracks =
    pack.tracks ??
    pack.trackIds.flatMap((id) => {
      const track = getBeat(id);
      return track ? [track] : [];
    });
  return (
    <Dialog.Root modal={compactWindow} open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="pack-explorer-overlay" />
        <Dialog.Content
          className="pack-explorer-dialog"
          data-unlock-effect={recentUnlock === pack.id}
          onInteractOutside={(event) => {
            if (!compactWindow) event.preventDefault();
          }}
          aria-describedby={undefined}
        >
          {recentUnlock === pack.id && <UnlockOrbit />}
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
                <span>
                  {recentUnlock === pack.id ? (
                    <UnlockFeedback label="PACK UNLOCKED" />
                  ) : unlocked ? (
                    "OPEN PACK"
                  ) : (
                    "LOCKED PACK"
                  )}
                </span>
                <h2>{pack.title}</h2>
              </div>
              <strong>${pack.price}</strong>
            </div>
            {!unlocked ? (
              <div className="pack-explorer-heading">
                <p>
                  Vote to unlock this archive&apos;s previews. Purchase is
                  required to download the complete pack.
                </p>
                <button
                  onClick={() => {
                    unlock(pack.id);
                    showUnlock(pack.id);
                  }}
                >
                  VOTE TO HACK
                </button>
              </div>
            ) : (
              <>
                <div className="pack-explorer-columns">
                  <span>Name</span>
                  <span>Genre</span>
                  <span>BPM</span>
                  <span>Length</span>
                  <span>Preview</span>
                </div>
                <div className="pack-explorer-files">
                  {tracks.map((track) => {
                    const playing =
                      player.trackId === track.id && player.isPlaying;
                    return (
                      <button
                        className="pack-explorer-file"
                        key={track.id}
                        onClick={() =>
                          pack.tracks
                            ? player.playPack(
                                track.id,
                                pack.tracks.map((t) => ({
                                  ...t,
                                  producer: pack.producer,
                                  cover: pack.cover,
                                  packId: pack.id,
                                  href: `/packs/${pack.slug}`,
                                  artwork: "paper",
                                  synthetic: false,
                                })),
                              )
                            : player.play(track.id)
                        }
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
              </>
            )}
            <div className="pack-explorer-status">
              <span>{tracks.length} object(s)</span>
              <span>{pack.format}</span>
            </div>
          </div>
          <footer className="pack-explorer-purchase">
            <p>
              <span>{purchased ? "ALREADY ACQUIRED" : "COMPLETE PACK"}</span>
              {purchased
                ? "This pack is permanently saved to your library."
                : `${tracks.length} preview beats / secure ZIP download`}
            </p>
            {purchased ? (
              <Link className="pack-owned-button" href="/library">
                <Check size={14} /> OWNED / OPEN MY LIBRARY
              </Link>
            ) : inCart ? (
              <Link className="pack-owned-button" href="/cart">
                <Check size={14} /> IN CART / VIEW CART
              </Link>
            ) : (
              <button
                disabled={!unlocked}
                onClick={() => add(pack.id, pack.title, pack.price)}
              >
                <ShoppingBag size={14} /> ADD COMPLETE PACK / ${pack.price}
              </button>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
