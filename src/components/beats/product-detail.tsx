"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, ShoppingBag, ShieldCheck } from "lucide-react";
import type { Beat } from "@/types/beat";
import { useCart } from "@/stores/cart-store";
import { usePlayer } from "@/stores/player-store";
import { Artwork } from "./artwork";
import { PlayButton } from "@/components/audio/play-button";
import { Waveform } from "@/components/audio/waveform";
import { Button } from "@/components/ui/button";
import { money, time } from "@/lib/utils";
export function ProductDetail({ beat }: { beat: Beat }) {
  const [licenseId, setLicenseId] = useState(beat.licenses[0].id);
  const [tab, setTab] = useState("Description");
  const cart = useCart();
  const router = useRouter();
  const active = usePlayer((s) => s.trackId === beat.id && s.isPlaying);
  const progress = usePlayer((s) => (s.trackId === beat.id ? s.progress : 0));
  const selected = beat.licenses.find((l) => l.id === licenseId)!;
  const added = cart.items.some(
    (i) => i.beatId === beat.id && i.licenseId === licenseId,
  );
  function add() {
    cart.add({ beatId: beat.id, licenseId });
  }
  return (
    <>
      <div className="product-grid">
        <div className="product-art-column">
          <Artwork kind={beat.artwork} title={beat.title} />
          <div className="product-art-note">
            <span>ORIGINAL COMPOSITION</span>
            <span>LOST FILES / 001</span>
          </div>
          <p className="product-art-caption">
            A new starting point.
            <br />A sound that’s entirely yours to shape.
          </p>
        </div>
        <div className="product-info">
          <span className="eyebrow">AUDIO FILE / LICENSE OPTIONS</span>
          <h1>{beat.title}</h1>
          <div className="product-byline">
            <p>
              Produced by <strong>{beat.producer}</strong>
            </p>
            <p>
              <strong>{money(beat.startingPrice)}</strong>{" "}
              <span>starting price</span>
            </p>
          </div>
          <div className="tags">
            {[beat.genre, ...beat.mood, `${beat.bpm} BPM`, beat.key].map(
              (tag) => (
                <span key={tag}>{tag}</span>
              ),
            )}
          </div>
          <div className="product-audio">
            <PlayButton id={beat.id} title={beat.title} />
            <div>
              <Waveform active={active} />
              <div className="wave-label">
                <span>
                  {time(Math.floor((beat.duration * progress) / 100))}
                </span>
                <span>VISUAL DEMO · AUDIO COMING SOON</span>
                <span>{time(beat.duration)}</span>
              </div>
            </div>
          </div>
          <fieldset className="license-selector">
            <legend>
              Choose your license <span>01 — SELECT A PACKAGE</span>
            </legend>
            <div className="license-grid">
              {beat.licenses.map((license) => (
                <label
                  className={`license-card ${license.id === licenseId ? "selected" : ""}`}
                  key={license.id}
                >
                  <input
                    type="radio"
                    name="license"
                    value={license.id}
                    checked={licenseId === license.id}
                    onChange={() => setLicenseId(license.id)}
                  />
                  <span className="license-name">
                    {license.name}
                    <span className="radio-mark">
                      {license.id === licenseId && <Check size={11} />}
                    </span>
                  </span>
                  <strong>${license.price}</strong>
                  <span className="license-description">
                    {license.description}
                  </span>
                  <span className="license-includes">
                    {license.includes.map((item) => (
                      <span key={item}>
                        <Check size={12} />
                        {item}
                      </span>
                    ))}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="purchase-actions">
            <Button onClick={add}>
              {added ? <Check /> : <ShoppingBag />}
              {added ? "Added to Cart" : "Add to Cart"}{" "}
              <span>{money(selected.price)}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                add();
                router.push("/cart");
              }}
            >
              Buy Now <ArrowUpRight />
            </Button>
          </div>
          <p className="purchase-note">
            <ShieldCheck size={14} /> License details below. Checkout available
            in a future release.
          </p>
          <span role="status" className="sr-only">
            {added ? `${selected.name} is in your cart` : ""}
          </span>
        </div>
      </div>
      <section className="product-details">
        <div
          role="tablist"
          aria-label="Product details"
          className="detail-tabs"
        >
          {["Description", "License Info", "Specs"].map((label) => (
            <button
              role="tab"
              id={`tab-${label.replaceAll(" ", "-")}`}
              aria-selected={tab === label}
              aria-controls="product-panel"
              tabIndex={tab === label ? 0 : -1}
              key={label}
              onClick={() => setTab(label)}
              onKeyDown={(e) => {
                const tabs = ["Description", "License Info", "Specs"];
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : (tabs.indexOf(tab) +
                            (e.key === "ArrowRight" ? 1 : 2)) %
                          3;
                  setTab(tabs[next]);
                  document
                    .getElementById(`tab-${tabs[next].replaceAll(" ", "-")}`)
                    ?.focus();
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          tabIndex={0}
          id="product-panel"
          aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}
          className="detail-content"
        >
          {tab === "Description" ? (
            <>
              <h2>Set the mood. Tell your story.</h2>
              <p>
                {beat.slug === "midnight-drive"
                  ? "A moody melodic composition with cinematic textures, atmospheric melodies, and hard-hitting drums."
                  : `An original ${beat.genre.toLowerCase()} production with ${beat.mood.join(", ").toLowerCase()} textures, crafted by ${beat.producer}.`}
              </p>
            </>
          ) : tab === "License Info" ? (
            <>
              <h2>A package for your process.</h2>
              <p>
                MP3 is intended for personal and demo use. WAV includes
                commercial release usage. WAV + Stems adds individual track
                stems and expanded usage. These are illustrative package
                summaries; final usage limits and legal license terms will be
                provided before purchasing becomes available.
              </p>
            </>
          ) : (
            <dl className="spec-grid">
              {[
                ["Tempo", `${beat.bpm} BPM`],
                ["Key", beat.key],
                ["Genre", beat.genre],
                ["Mood", beat.mood.join(" / ")],
                ["Duration", time(beat.duration)],
                ["Producer", beat.producer],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    </>
  );
}
