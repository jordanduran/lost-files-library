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
  const [activePack, setActivePack] = useState<string | null>(null);
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
          aria-label={`${producer.name} featured archive`}
        >
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
                PRODUCER ARCHIVE // {unlocked ? "UNLOCKED" : "LOCKED"}
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
          <div className="midnight-profile-content">
            <div className="archive-profile-bio">
              {producer.image && (
                <Image
                  src={producer.image}
                  alt={producer.name}
                  width={140}
                  height={164}
                />
              )}
              <div>
                <span className="archive-eyebrow">PRODUCER ARCHIVE</span>
                <h2>{producer.name}</h2>
                <p>{producer.bio}</p>
                {producer.role && (
                  <span className="archive-profile-role">{producer.role}</span>
                )}
              </div>
              <dl className="archive-profile-stats">
                <div>
                  <dt>Packs</dt>
                  <dd>{packs.length}</dd>
                </div>
                <div>
                  <dt>Files</dt>
                  <dd>{packs.reduce((sum, p) => sum + p.files, 0)}</dd>
                </div>
                <div>
                  <dt>Archive</dt>
                  <dd>{producer.archiveNumber}</dd>
                </div>
              </dl>
            </div>
            <h3>
              Packs <span>{packs.length}</span>
            </h3>
            <p className="archive-pack-help">
              Vote on locked packs here, then open their files to preview.
              Purchases include the full download.
            </p>
            <div className="archive-profile-packs">
              {packs.map((pack) => {
                const owned = purchasedPackIds.includes(pack.id);
                const locked =
                  pack.locked && !owned && !unlockedProducers.includes(pack.id);
                return (
                  <div className="archive-pack-row" key={pack.id}>
                    {pack.cover ? (
                      <Image src={pack.cover} alt="" width={56} height={56} />
                    ) : (
                      <Folder size={35} />
                    )}
                    <div className="archive-pack-info">
                      <strong>{pack.title}</strong>
                      <small>
                        {pack.files} FILES /{" "}
                        {owned ? "OWNED" : `$${pack.price}`}
                      </small>
                      <span className="archive-pack-state">
                        {locked ? (
                          <LockKeyhole size={13} />
                        ) : (
                          <FolderOpen size={13} />
                        )}
                        {locked ? "LOCKED" : "UNLOCKED"}
                      </span>
                    </div>
                    {locked ? (
                      <button
                        className="archive-electric"
                        aria-label={`Vote to hack ${pack.title}`}
                        onClick={() => unlock(pack.id)}
                      >
                        <Zap size={15} /> VOTE TO HACK
                      </button>
                    ) : (
                      <StorePackExplorer
                        pack={pack}
                        purchased={owned}
                        open={activePack === pack.id}
                        onOpenChange={(nextOpen) =>
                          setActivePack(nextOpen ? pack.id : null)
                        }
                      >
                        <button
                          className="archive-electric"
                          aria-label={`Open ${pack.title}`}
                        >
                          <FolderOpen size={15} /> OPEN PACK
                        </button>
                      </StorePackExplorer>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
