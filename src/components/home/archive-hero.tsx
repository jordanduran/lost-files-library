"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Folder, FolderOpen, RotateCcw, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { Producer } from "@/types/producer";
import type { StorePack } from "@/data/store-packs";
import { usePack } from "@/stores/pack-store";
import { ProducerProfile } from "@/components/producers/producer-profile";
import { useCompactWindow } from "@/components/packs/use-compact-window";
import {
  UnlockFeedback,
  UnlockOrbit,
  useUnlockFeedback,
} from "@/components/packs/unlock-feedback";

export function ArchiveHero({
  producer,
  packs,
  purchasedPackIds,
}: {
  producer: Producer;
  packs: StorePack[];
  purchasedPackIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [activePack, setActivePack] = useState<string | null>(null);
  const [hacking, setHacking] = useState(false);
  const [recentUnlock, showUnlock] = useUnlockFeedback();
  const [ready, setReady] = useState(false);
  const { unlockedProducers, unlock, lock } = usePack();
  const compact = useCompactWindow();
  const archiveKey = `archive:${producer.name.toLowerCase().trim()}`;
  const unlocked =
    packs.some((pack) => purchasedPackIds.includes(pack.id)) ||
    (ready && unlockedProducers.includes(archiveKey));
  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() =>
      setReady(true),
    );
  }, []);
  useEffect(() => {
    if (!hacking) return;
    const timer = window.setTimeout(
      () => {
        unlock(archiveKey);
        showUnlock(archiveKey);
        setHacking(false);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150,
    );
    return () => window.clearTimeout(timer);
  }, [hacking, archiveKey, unlock, showUnlock]);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // A nested pack closes first; keep the artist archive behind it.
        if (!nextOpen && activePack !== null) return;
        setOpen(nextOpen);
      }}
      modal={compact}
    >
      <div className="producer-hack page-width">
        <section
          className={`hack-target ${hacking ? "is-hacking" : ""}`}
          data-unlock-effect={recentUnlock === archiveKey}
          aria-label={`${producer.name} featured archive`}
        >
          {recentUnlock === archiveKey && <UnlockOrbit />}
          <div className="hack-photo">
            {producer.image ? (
              <Image
                src={producer.image}
                alt={`${producer.name} in the studio`}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 40vw"
              />
            ) : (
              <Folder size={64} />
            )}
            <span>CLASSIFIED</span>
            <small>
              {producer.name.toUpperCase()} / {producer.role.toUpperCase()} /{" "}
              {producer.archiveNumber}
            </small>
          </div>
          <div className="hack-copy">
            <div className="hack-meta">
              <span>
                {recentUnlock === archiveKey ? (
                  <UnlockFeedback label="PRODUCER ARCHIVE // UNLOCKED" />
                ) : (
                  <>PRODUCER ARCHIVE // {unlocked ? "UNLOCKED" : "LOCKED"}</>
                )}
              </span>
              <span>TARGET {producer.archiveNumber}</span>
            </div>
            <span className="hack-eyebrow">
              HACK TARGET {producer.archiveNumber}
            </span>
            <h1>{producer.name}</h1>
            <p>{producer.bio}</p>
            <div className="archive-facts">
              <span>
                {packs.length} {packs.length === 1 ? "PACK" : "PACKS"}
              </span>
              <span>{packs.reduce((sum, p) => sum + p.files, 0)} FILES</span>
              <span>PRODUCER ARCHIVE</span>
            </div>
            <div className="hack-votes">
              <div>
                <span>{unlocked ? "1 / 1 VOTE" : "0 / 1 VOTE"}</span>
                <span>
                  {unlocked ? "ARCHIVE OPEN" : "1 VOTE REQUIRED TO HACK"}
                </span>
              </div>
              <div
                className="hack-progress"
                role="progressbar"
                aria-label="Producer archive access"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={unlocked ? 1 : 0}
              >
                <span style={{ width: unlocked ? "100%" : "0%" }} />
              </div>
            </div>
            <div className="hack-actions">
              {unlocked ? (
                <Dialog.Trigger asChild>
                  <button className="archive-electric">
                    <FolderOpen size={17} /> OPEN ARCHIVE
                  </button>
                </Dialog.Trigger>
              ) : (
                <button
                  className="archive-electric"
                  disabled={!ready || hacking}
                  onClick={() => setHacking(true)}
                >
                  <Zap size={17} />
                  {hacking ? "HACKING ARCHIVE..." : "VOTE TO HACK"}
                </button>
              )}
            </div>
            <p className="archive-access-note" role="status">
              {unlocked ? (
                <>
                  <Check size={15} /> HACK COMPLETE / EXPLORE THE PRODUCER
                  ARCHIVE
                </>
              ) : (
                "Unlock the artist archive. Explore the packs inside."
              )}
            </p>
            {process.env.NODE_ENV === "development" && (
              <button
                className="unlock-preview-reset"
                disabled={!ready || hacking}
                onClick={() => {
                  setActivePack(null);
                  setOpen(false);
                  showUnlock(null);
                  lock(archiveKey);
                  packs.forEach((pack) => lock(pack.id));
                }}
              >
                <RotateCcw size={13} aria-hidden="true" /> Reset unlock demo
              </button>
            )}
          </div>
        </section>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="desktop-window-overlay" />
        <Dialog.Content
          className="midnight-profile"
          onEscapeKeyDown={(event) => {
            if (activePack !== null) {
              event.preventDefault();
              setActivePack(null);
            }
          }}
          aria-describedby={undefined}
          onInteractOutside={(e) => {
            if (!compact) e.preventDefault();
          }}
        >
          <div className="midnight-bar">
            <Dialog.Title>{producer.name} / Archive</Dialog.Title>
            <Dialog.Close
              className="window-close"
              aria-label="Close artist archive"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <ProducerProfile
            producer={producer}
            packs={packs}
            purchasedPackIds={purchasedPackIds}
            activePack={activePack}
            onActivePackChange={setActivePack}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
