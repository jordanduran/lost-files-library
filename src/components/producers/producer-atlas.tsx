"use client";
import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { CITIES } from "@/data/producer-cities";
import { ProducerGlobe } from "./producer-globe";
import { setCityVote } from "@/app/producers/actions";
export function ProducerAtlas({
  initialVotes,
  initialStandings,
}: {
  initialVotes: string[] | null;
  initialStandings: { city: string; votes: number }[] | null;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [votes, setVotes] = useState(initialVotes);
  const [standings, setStandings] = useState(initialStandings);
  const [transmitted, setTransmitted] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [globeCollapsed, setGlobeCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(null), 3500);
    return () => clearTimeout(timer);
  }, [active]);
  function choose(city: string) {
    setActive(city);
    if (pending) return;
    if (votes === null) {
      setMessage(
        "Your votes could not be loaded. Refresh the page to try again.",
      );
      return;
    }
    const enabled = !votes.includes(city);
    setTransmitted(null);
    startTransition(async () => {
      setMessage(
        enabled ? "Transmitting your vote..." : "Removing your vote...",
      );
      try {
        const result = await setCityVote(city, enabled);
        setNeedsLogin(Boolean(result.needsLogin));
        if (result.error) setMessage(result.error);
        else if ("saved" in result && result.saved) {
          setVotes(
            result.votes ??
              (enabled
                ? [...votes, city]
                : votes.filter((value) => value !== city)),
          );
          setStandings(result.standings ?? null);
          setTransmitted(city);
          setMessage(
            (enabled
              ? "Signal received. Vote saved for "
              : "Vote removed for ") +
              city +
              "." +
              (result.standings === null
                ? " Standings are temporarily unavailable."
                : ""),
          );
        }
      } catch {
        setMessage("Connection interrupted. Please try again.");
      }
    });
  }
  const countFor = (city: string) =>
    Number(standings?.find((row) => row.city === city)?.votes ?? 0);
  const total =
    standings?.reduce((sum, row) => sum + Number(row.votes), 0) ?? 0;
  const leaderCount = Math.max(
    0,
    ...(standings ?? []).map((row) => Number(row.votes)),
  );
  return (
    <div className="producer-atlas page-width">
      <header className="atlas-heading">
        <span className="eyebrow">LOST FILES / WORLD ATLAS</span>
        <h1>
          Independent sound.
          <br />
          <span>Worldwide.</span>
        </h1>
        <p>Every city has a frequency. Find the people behind it.</p>
      </header>
      <section
        className="atlas-map atlas-window"
        data-collapsed={globeCollapsed}
        aria-label="Explore producer cities"
      >
        <div className="atlas-window-titlebar">
          <span>C:\LOST_FILES\WORLD_ATLAS.EXE</span>
          <div>
            <button
              onClick={() => setGlobeCollapsed((value) => !value)}
              aria-label={globeCollapsed ? "Restore globe" : "Minimize globe"}
              title={globeCollapsed ? "Restore" : "Minimize"}
            >
              &minus;
            </button>
            <span aria-hidden="true">□</span>
            <span aria-hidden="true">×</span>
          </div>
        </div>
        <div className="atlas-window-menu">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Scan</span>
          <span>Help</span>
        </div>
        <div className="atlas-window-body">
          <div className="atlas-readout">
            <span>GLOBAL FREQUENCIES / 001</span>
            <span>{active ?? "SCANNING THE ARCHIVE"}</span>
          </div>
          <ProducerGlobe activeCity={active} onSelect={choose} />
          <div className="atlas-readout atlas-instructions">
            <span>DRAG TO ROTATE / SELECT A CITY</span>
            <button onClick={() => setActive(null)}>RESET SCAN +</button>
          </div>
        </div>
      </section>
      <section className="atlas-voting" aria-labelledby="vote-heading">
        <span className="eyebrow">NEXT TRANSMISSION / YOUR CALL</span>
        <h2 id="vote-heading">Where do we hack next?</h2>
        <p>
          Choose the cities. We will discover the producers shaping their sound.
        </p>
        <div
          className="city-votes"
          aria-label="Vote for the next producer city"
          aria-busy={pending}
        >
          {CITIES.map((city) => {
            const count = countFor(city.name);
            const rank =
              1 + CITIES.filter((other) => countFor(other.name) > count).length;
            const voted = votes?.includes(city.name) ?? false;
            const share = total ? Math.round((count / total) * 100) : 0;
            return (
              <button
                key={city.name}
                className="city-vote"
                data-active={active === city.name}
                data-transmitted={transmitted === city.name}
                aria-pressed={voted}
                disabled={pending}
                onMouseEnter={() => setActive(city.name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(city.name)}
                onBlur={() => setActive(null)}
                onClick={() => choose(city.name)}
              >
                <span className="city-code">
                  {standings === null
                    ? "STANDINGS OFFLINE"
                    : count === 0
                      ? "AWAITING SIGNAL"
                      : "RANK " +
                        String(rank).padStart(2, "0") +
                        (count === leaderCount ? " / LEADING" : "")}
                </span>
                <span className="city-name">{city.name}</span>
                <span className="city-standing">
                  <span>
                    {standings === null ? "--" : count.toLocaleString()}{" "}
                    {count === 1 ? "vote" : "votes"}
                  </span>
                  <span>{standings === null ? "--" : share + "%"}</span>
                </span>
                <span className="city-meter" aria-hidden="true">
                  <span style={{ width: share + "%" }} />
                </span>
                <span className="city-command">
                  {voted ? "[ VOTED / CLICK TO REMOVE ]" : "[ SEND SIGNAL + ]"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="standings-note">
          {standings === null
            ? "Standings are temporarily unavailable."
            : total.toLocaleString() +
              " total votes. Percentages show each city?s share of all votes."}
        </p>
        <p className="standings-note">
          One vote per city, per account. Support as many cities as you like.
          Click a voted city to remove your vote.
        </p>
        <div className="vote-status" role="status" aria-live="polite">
          {message}
        </div>
        {needsLogin && (
          <Link href="/login" className="text-link">
            Sign in to vote
          </Link>
        )}
      </section>
    </div>
  );
}
