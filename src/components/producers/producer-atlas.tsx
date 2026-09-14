"use client";
import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { CITIES } from "@/data/producer-cities";
import { ProducerGlobe } from "./producer-globe";
import { voteForCity, removeCityVote } from "@/app/producers/actions";
export function ProducerAtlas({initialVote}: {initialVote: string | null}) {
  const [active, setActive] = useState<string | null>(null);
  const [vote, setVote] = useState(initialVote);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(null), 3500);
    return () => clearTimeout(timer);
  }, [active]);
  function unvote() {
    if (pending) return;
    startTransition(async () => {
      try {
        const result = await removeCityVote();
        setNeedsLogin(Boolean(result.needsLogin));
        if(result.error) setMessage(result.error);
        else {setVote(null);setActive(null);setMessage("Vote removed. The next destination is up to you.");}
      } catch {setMessage("Could not remove your vote. Please try again.");}
    });
  }
  function choose(city: string) {
    setActive(city);
    if (pending) return;
    startTransition(async () => {
      setMessage("Transmitting your vote...");
      try {
        const result = await voteForCity(city);
        setNeedsLogin(Boolean(result.needsLogin));
        if (result.error) setMessage(result.error);
        else {setVote(city); setMessage("Signal received. Your vote: " + city + ".");}
      } catch {setMessage("Connection interrupted. Please try again.");}
    });
  }
  return <div className="producer-atlas page-width">
    <header className="atlas-heading"><span className="eyebrow">LOST FILES / WORLD ATLAS</span><h1>Independent sound.<br/><span>Worldwide.</span></h1><p>Every city has a frequency. Find the people behind it.</p></header>
    <section className="atlas-map" aria-label="Explore producer cities">
      <div className="atlas-readout"><span>GLOBAL FREQUENCIES / 001</span><span>{active ?? "SCANNING THE ARCHIVE"}</span></div>
      <ProducerGlobe activeCity={active} onSelect={choose}/>
      <div className="atlas-readout atlas-instructions"><span>DRAG TO ROTATE / SELECT A CITY</span><button onClick={() => setActive(null)}>RESET SCAN +</button></div>
    </section>
    <section className="atlas-voting" aria-labelledby="vote-heading">
      <span className="eyebrow">NEXT TRANSMISSION / YOUR CALL</span>
      <h2 id="vote-heading">Where do we hack next?</h2>
      <p>Choose the city. We will discover the producers shaping its sound.</p>
      <div className="city-votes" aria-label="Vote for the next producer city" aria-busy={pending}>
        {CITIES.map((city, index) => <button key={city.name} className="city-vote" data-active={active === city.name} aria-pressed={vote === city.name} disabled={pending}
          onMouseEnter={() => setActive(city.name)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(city.name)} onBlur={() => setActive(null)} onClick={() => choose(city.name)}>
          <span className="city-code">{String(index+1).padStart(2,"0")} / {Math.abs(city.lat).toFixed(2)}{city.lat >= 0 ? "N" : "S"}</span>
          <span className="city-name">{city.name}</span><span className="city-command">{vote === city.name ? "[ VOTE SAVED ]" : "[ SEND SIGNAL + ]"}</span>
        </button>)}
      </div>
      <div className="vote-status" role="status" aria-live="polite">{message || (vote ? "Your vote: " + vote + ". Select another city to change it." : "One city. One vote per account. You can change your choice anytime.")}</div>
      {vote && <button className="remove-vote" disabled={pending} onClick={unvote}>{pending ? "PLEASE WAIT..." : "[ REMOVE MY VOTE ]"}</button>}
      {needsLogin && <Link href="/login" className="text-link">Sign in to vote</Link>}
    </section>
  </div>;
}
