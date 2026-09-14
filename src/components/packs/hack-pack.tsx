"use client";

import { useEffect, useState } from "react";
import {
  Check,
  LockKeyhole,
  LockKeyholeOpen,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePack } from "@/stores/pack-store";

export function HackPack() {
  const { unlocked, unlock, unvote } = usePack();
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    void usePack.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (!unlocking) return;
    const timer = window.setTimeout(
      () => {
        unlock();
        setUnlocking(false);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 100
        : 1800,
    );
    return () => window.clearTimeout(timer);
  }, [unlocking, unlock]);

  const state = unlocked ? "unlocked" : unlocking ? "unlocking" : "locked";
  return (
    <section className={`hack-pack is-${state}`} aria-labelledby="pack-title">
      <div className="pack-visual" aria-hidden="true">
        <div className="pack-visual-label">
          <span>LOST FILES / VAULT 001</span>
          <span>{state.toUpperCase()}</span>
        </div>
        <div className="pack-folder">
          <div className="pack-folder-tab" />
          <div className="pack-folder-sheet">
            <span>AFTER HOURS</span>
            <span>VOL. 001 / SOUND PACK</span>
          </div>
          <div className="pack-folder-front">
            <span className="pack-folder-number">001</span>
            <div className="pack-lock">
              {unlocked ? (
                <LockKeyholeOpen size={32} />
              ) : (
                <LockKeyhole size={32} />
              )}
            </div>
            <span className="pack-folder-caption">
              {unlocked ? "ACCESS GRANTED" : "UNRELEASED SOUNDS"}
            </span>
          </div>
        </div>
        <span className="pack-visual-footer">
          {unlocked
            ? "THE VAULT IS OPEN. MAKE SOMETHING."
            : "ONE VOTE CLOSER TO YOUR NEXT SOUND."}
        </span>
      </div>
      <div className="pack-copy">
        <span className="pack-status">
          {unlocked ? <Check size={13} /> : <LockKeyhole size={13} />}
          {unlocked ? "PACK UNLOCKED" : "LOCKED DROP"}
        </span>
        <h2 id="pack-title">
          After Hours<span>.</span>
        </h2>
        <p className="pack-description">
          A collection for the late sessions. Dusty drums, warm textures, and
          melodies that stay with you.
        </p>
        <p className="pack-format">
          SOUND PACK <span>/</span> VOL. 001 <span>/</span> WAV + ZIP
        </p>
        <div className="pack-votes">
          <span>{unlocked || unlocking ? "1" : "0"} / 1 vote</span>
          <span>
            {unlocked
              ? "Goal reached"
              : unlocking
                ? "Vote counted"
                : "1 vote to unlock"}
          </span>
        </div>
        <div
          className="pack-progress"
          role="progressbar"
          aria-label="Pack unlock votes"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={unlocked || unlocking ? 1 : 0}
        >
          <span />
        </div>
        <p className="pack-message" role="status" aria-live="polite">
          {unlocked
            ? "You unlocked it. The next session starts here."
            : unlocking
              ? "Vote counted. Unlocking the pack…"
              : "Be the one to open the vault. Vote to release this pack."}
        </p>
        {unlocked ? (
          <div className="pack-actions">
            <Button asChild><Link href="/packs/checkout"><ShoppingBag /> Purchase pack</Link></Button>
            <p>Review the pack, pay, then download your ZIP and license. No account required.</p>
          </div>
        ) : (
          <Button
            className="pack-vote-button"
            disabled={unlocking}
            onClick={() => setUnlocking(true)}
          >
            <Zap />
            {unlocking ? "Unlocking…" : "Vote to unlock"}
          </Button>
        )}
        {unlocked && (
          <Button variant="outline" className="mt-3 w-full" onClick={unvote}>
            Unvote & lock again
          </Button>
        )}
        <p className="pack-preview-note">
          Preview drop · 1 vote to unlock. Unlock saved in this browser.
          Purchase access is verified securely after payment.
        </p>
      </div>
    </section>
  );
}
