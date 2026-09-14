"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  FileAudio,
  Folder,
  FolderOpen,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  UnlockKeyhole,
  Zap,
} from "lucide-react";
import { usePackCart } from "@/stores/pack-cart-store";
import { usePack } from "@/stores/pack-store";
import { usePlayer } from "@/stores/player-store";
import type { Producer, ProducerPack, ProducerTrack } from "@/types/producer";

function fileName(title: string) {
  return `${title.toUpperCase().replaceAll(" ", "_")}.WAV`;
}

function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function ProducerArchive({ producer, onClose }: { producer: Producer; onClose: () => void }) {
  const [selectedPack, setSelectedPack] = useState<ProducerPack>(producer.packs[0]);
  const [selectedTrack, setSelectedTrack] = useState<ProducerTrack>(producer.packs[0].tracks[0]);
  const player = usePlayer();
  const playing = player.trackId === selectedTrack.id && player.isPlaying;

  function selectPack(pack: ProducerPack) {
    setSelectedPack(pack);
    setSelectedTrack(pack.tracks[0]);
  }

  return (
    <section className="producer-archive page-width" aria-labelledby="archive-title">
      <header className="archive-complete">
        <div><Check size={17} /> HACK COMPLETE</div>
        <strong>1 / 1 VOTE</strong>
        <span>FILES UNLOCKED</span>
      </header>

      <div className="archive-desktop">
        <aside className="archive-desktop-icons" aria-label="Producer folders">
          {producer.packs.map((pack) => (
            <button key={pack.id} onClick={() => selectPack(pack)}>
              {selectedPack.id === pack.id ? <FolderOpen size={34} /> : <Folder size={34} />}
              <span>{pack.title.toUpperCase().replaceAll(" ", "_")}</span>
            </button>
          ))}
          <button onClick={onClose}>
            <RotateCcw size={31} />
            <span>CLOSE_ARCHIVE</span>
          </button>
        </aside>

        <div className="archive-window">
          <div className="archive-titlebar">
            <span>C:\LOST_FILES\{producer.name.toUpperCase().replaceAll(" ", "_")}\PACKS</span>
            <span>_ □ ×</span>
          </div>
          <div className="archive-menubar">
            <span>File</span><span>Edit</span><span>View</span><span>Tools</span><span>Help</span>
          </div>
          <div className="archive-address">
            Address&nbsp;&nbsp; C:\LOST_FILES\PRODUCERS\{producer.archiveNumber}\{selectedPack.slug.toUpperCase()}
          </div>
          <div className="archive-body">
            <nav className="archive-tree" aria-label="Pack folders">
              <strong>Lost Files Library</strong>
              <span>└─ Producers</span>
              <span>&nbsp;&nbsp;└─ {producer.archiveNumber}_{producer.name}</span>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;└─ Packs</span>
              {producer.packs.map((pack) => (
                <button key={pack.id} onClick={() => selectPack(pack)}>
                  <Folder size={14} /> {pack.catalogNumber}_{pack.title}
                </button>
              ))}
            </nav>
            <div className="archive-files">
              <div className="archive-columns">
                <span>Name</span><span>Type</span><span>BPM</span><span>Length</span>
              </div>
              {selectedPack.tracks.map((track) => (
                <button
                  className="archive-file"
                  data-selected={selectedTrack.id === track.id}
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  onDoubleClick={() => player.play(track.id)}
                >
                  <span><FileAudio size={14} /> {fileName(track.title)}</span>
                  <span>WAV File</span><span>{track.bpm}</span><span>{duration(track.duration)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="archive-statusbar">
            <span>{selectedPack.tracks.length} object(s)</span><span>{selectedPack.format}</span>
          </div>
        </div>
      </div>

      <footer className="archive-inspector">
        <div>
          <span>FILE SELECTED / {selectedPack.catalogNumber}</span>
          <h2 id="archive-title">{selectedTrack.title}</h2>
          <p>{selectedTrack.genre} / {selectedTrack.bpm} BPM / {selectedTrack.key}</p>
        </div>
        <button onClick={() => player.play(selectedTrack.id)}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "PAUSE PREVIEW" : "PREVIEW FILE"}
        </button>
        <button onClick={() => usePackCart.getState().add(selectedPack.id)}><ShoppingBag size={14} /> ADD COMPLETE PACK / ${selectedPack.price}</button>
        <Link href="/cart">VIEW CART / CHECKOUT</Link>
      </footer>
    </section>
  );
}

export function ProducerHack({ producer }: { producer: Producer }) {
  const { unlockedProducers, unlock, lock } = usePack();
  const [hydrated, setHydrated] = useState(false);
  const [hacking, setHacking] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const unlocked = unlockedProducers.includes(producer.slug);

  useEffect(() => {
    void Promise.resolve(usePack.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hacking) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      unlock(producer.slug);
      setHacking(false);
    }, reducedMotion ? 100 : 1400);
    return () => window.clearTimeout(timer);
  }, [hacking, producer.slug, unlock]);

  if (hydrated && unlocked && archiveOpen) {
    return <ProducerArchive producer={producer} onClose={() => setArchiveOpen(false)} />;
  }

  const votes = unlocked || hacking ? producer.voteGoal : 0;

  return (
    <div className="producer-hack page-width">
      <section className={`hack-target ${hacking ? "is-hacking" : ""}`}>
        <div className="hack-photo">
          <Image src={producer.image} alt={`${producer.name} in the studio`} fill priority sizes="(max-width: 800px) 100vw, 48vw" />
          <span>CLASSIFIED</span>
          <small>{producer.name.toUpperCase()} / {producer.role.toUpperCase()} / {producer.archiveNumber}</small>
        </div>

        <div className="hack-copy">
          <div className="hack-meta">
            <span>PRODUCER ARCHIVE // {unlocked ? "UNLOCKED" : "LOCKED"}</span>
            <span>TARGET {producer.archiveNumber}</span>
          </div>
          <span className="hack-eyebrow">HACK TARGET {producer.archiveNumber}</span>
          <h1>{producer.name}</h1>
          <p>{producer.bio}</p>

          <div className="hack-pack-file">
            <div>
              {unlocked ? <UnlockKeyhole size={24} /> : <LockKeyhole size={24} />}
              <span>{unlocked ? "UNLOCKED PACK" : "LOCKED PACK"}</span>
            </div>
            <strong>{producer.packs[0].title}</strong>
            <small>{producer.packs[0].catalogNumber} / {producer.packs[0].tracks.length} FILES</small>
          </div>

          <div className="hack-votes">
            <div><span>{votes} / {producer.voteGoal} VOTE</span><span>{unlocked ? "GOAL REACHED" : "1 VOTE REQUIRED TO HACK"}</span></div>
            <div className="hack-progress" role="progressbar" aria-label={`${producer.name} archive unlock votes`} aria-valuemin={0} aria-valuemax={producer.voteGoal} aria-valuenow={votes}>
              <span style={{ width: `${(votes / producer.voteGoal) * 100}%` }} />
            </div>
          </div>

          <div className="hack-actions" role="status" aria-live="polite">
            {unlocked ? (
              <>
                <button onClick={() => setArchiveOpen(true)}><FolderOpen size={16} /> OPEN ALLEN&apos;S FILES</button>
                <button className="hack-reset" onClick={() => lock(producer.slug)}>RESET DEMO</button>
              </>
            ) : (
              <button disabled={hacking} onClick={() => setHacking(true)}>
                <Zap size={16} /> {hacking ? "HACKING ARCHIVE..." : "VOTE TO HACK"}
              </button>
            )}
          </div>
          <small className="hack-note">
            {unlocked ? "HACK COMPLETE. THE PRODUCER ARCHIVE IS READY." : "CAST THE VOTE THAT UNLOCKS ALLEN RITTER'S LOST FILES."}
          </small>
        </div>
      </section>

      <section className="hack-next">
        <span>NEXT TARGETS</span><p>More producer archives are being recovered.</p>
        <Link href="/producers">VIEW PRODUCER DIRECTORY →</Link>
      </section>
    </div>
  );
}
