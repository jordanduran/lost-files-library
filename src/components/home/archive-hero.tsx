"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Folder, FolderOpen, LockKeyhole, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { Producer } from "@/types/producer";
import type { StorePack } from "@/data/store-packs";
import { usePack } from "@/stores/pack-store";
import { StorePackExplorer } from "@/components/packs/store-pack-explorer";
import { useCompactWindow } from "@/components/packs/use-compact-window";

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
  const [hacking, setHacking] = useState(false);
  const [ready, setReady] = useState(false);
  const { unlockedProducers, unlock } = usePack();
  const compact = useCompactWindow();
  const archiveKey = `archive:${producer.name.toLowerCase().trim()}`;
  const unlocked = ready && unlockedProducers.includes(archiveKey);
  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() =>
      setReady(true),
    );
  }, []);
  useEffect(() => {
    if (!hacking) return;
    const timer = window.setTimeout(() => {
      unlock(archiveKey);
      setHacking(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [hacking, archiveKey, unlock]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal={compact}>
      <section
        className="archive-stage page-width"
        aria-label={`${producer.name} featured archive`}
      >
        <div className="archive-stack" aria-hidden="true">
          {["Archive index", "Session notes", "Recovered files"].map(
            (title, i) => (
              <div className={`archive-ghost archive-ghost-${i}`} key={title}>
                <div className="midnight-bar">
                  <Folder size={13} /> {title}
                  <span>− □ ×</span>
                </div>
                <div className="ghost-files">
                  {Array.from({ length: 5 }, (_, row) => (
                    <div key={row}>
                      <Folder size={12} />
                      <span />
                      <i />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
        <article className="archive-hero-window">
          <div className="midnight-bar">
            <Folder size={15} /> Producer archive
            <span aria-hidden="true">− □</span>
          </div>
          <div className="archive-hero-body">
            <div className="archive-portrait">
              {producer.image ? (
                <Image
                  src={producer.image}
                  alt={producer.name}
                  fill
                  priority
                  sizes="(max-width: 760px) 90vw, 340px"
                />
              ) : (
                <Folder size={80} />
              )}
            </div>
            <div className="archive-hero-copy">
              <span className="archive-eyebrow">
                HACK TARGET / {producer.archiveNumber}
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
              <div className="archive-hero-actions">
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
                    <Check size={15} /> HACK COMPLETE / ARCHIVE OPEN
                  </>
                ) : (
                  "Unlock the artist archive. Explore the packs inside."
                )}
              </p>
            </div>
          </div>
          <div className="midnight-status">
            <span>{"// ARCHIVE ACCESS"}</span>
            <span>{unlocked ? "ACCESS GRANTED" : "ACCESS PENDING"}</span>
          </div>
        </article>
      </section>
      <Dialog.Portal>
        <Dialog.Overlay className="desktop-window-overlay" />
        <Dialog.Content
          className="midnight-profile"
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
          <div className="midnight-profile-content">
            <div className="archive-profile-bio">
              {producer.image && (
                <Image
                  src={producer.image}
                  alt={producer.name}
                  width={140}
                  height={160}
                />
              )}
              <div>
                <span className="archive-eyebrow">PRODUCER ARCHIVE</span>
                <h2>{producer.name}</h2>
                <p>{producer.bio}</p>
              </div>
            </div>
            <h3>
              Packs <span>{packs.length}</span>
            </h3>
            <p className="archive-pack-help">
              Open a pack to preview its files. Purchases include the full
              download.
            </p>
            <div className="archive-profile-packs">
              {packs.map((pack) => {
                const owned = purchasedPackIds.includes(pack.id);
                const locked =
                  pack.locked && !owned && !unlockedProducers.includes(pack.id);
                return (
                  <StorePackExplorer
                    key={pack.id}
                    pack={pack}
                    purchased={owned}
                  >
                    <button className="archive-pack-row">
                      {pack.cover ? (
                        <Image src={pack.cover} alt="" width={56} height={56} />
                      ) : (
                        <Folder size={35} />
                      )}
                      <span>
                        <strong>{pack.title}</strong>
                        <small>
                          {pack.files} FILES /{" "}
                          {owned ? "OWNED" : `$${pack.price}`}
                        </small>
                      </span>
                      <span className="archive-pack-state">
                        {locked ? (
                          <LockKeyhole size={15} />
                        ) : (
                          <FolderOpen size={15} />
                        )}
                        {locked ? "LOCKED" : "OPEN PACK"}
                      </span>
                    </button>
                  </StorePackExplorer>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
