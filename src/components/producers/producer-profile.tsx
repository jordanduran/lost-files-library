"use client";
import Image from "next/image";
import { Folder, FolderOpen, LockKeyhole, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { usePack } from "@/stores/pack-store";
import { StorePackExplorer } from "@/components/packs/store-pack-explorer";
import type { Producer } from "@/types/producer";
import type { StorePack } from "@/data/store-packs";
import {
  UnlockFeedback,
  useUnlockFeedback,
} from "@/components/packs/unlock-feedback";
export function ProducerProfile({
  producer,
  packs,
  purchasedPackIds,
  activePack,
  onActivePackChange: setActivePack,
}: {
  producer: Producer;
  packs: StorePack[];
  purchasedPackIds: string[];
  activePack: string | null;
  onActivePackChange: (id: string | null) => void;
}) {
  const { unlockedProducers, unlock } = usePack();
  const [recentUnlock, showUnlock] = useUnlockFeedback();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() =>
      setReady(true),
    );
  }, []);
  return (
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
        Vote on locked packs here, then open their files to preview. Purchases
        include the full download.
      </p>
      <div className="archive-profile-packs">
        {packs.map((pack) => {
          const owned = purchasedPackIds.includes(pack.id);
          const locked =
            pack.locked &&
            !owned &&
            !(ready && unlockedProducers.includes(pack.id));
          return (
            <div
              className="archive-pack-row"
              key={pack.id}
              data-unlock-effect={recentUnlock === pack.id}
            >
              {pack.cover ? (
                <Image src={pack.cover} alt="" width={56} height={56} />
              ) : (
                <Folder size={35} />
              )}
              <div className="archive-pack-info">
                <strong>{pack.title}</strong>
                <small>
                  {pack.files} FILES / {owned ? "OWNED" : `$${pack.price}`}
                </small>
                <span className="archive-pack-state">
                  {recentUnlock === pack.id ? (
                    <UnlockFeedback label="UNLOCKED" />
                  ) : (
                    <>
                      {locked ? (
                        <LockKeyhole size={13} />
                      ) : (
                        <FolderOpen size={13} />
                      )}
                      {locked ? "LOCKED" : "UNLOCKED"}
                    </>
                  )}
                </span>
              </div>
              {locked ? (
                <button
                  className="archive-electric"
                  aria-label={`Vote to hack ${pack.title}`}
                  disabled={!ready}
                  onClick={() => {
                    unlock(pack.id);
                    showUnlock(pack.id);
                  }}
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
  );
}
