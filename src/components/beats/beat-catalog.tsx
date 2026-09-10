"use client";
import { useState } from "react";
import { beats } from "@/data/mock-beats";
import { BeatFilters, initialFilters } from "./beat-filters";
import { BeatRow } from "./beat-row";
import { Button } from "@/components/ui/button";
export function BeatCatalog() {
  const [filters, setFilters] = useState(initialFilters);
  const visible = beats
    .filter((b) => {
      const query = filters.search.toLowerCase().trim();
      return (
        (!query ||
          `${b.title} ${b.producer} ${b.genre} ${b.mood.join(" ")}`
            .toLowerCase()
            .includes(query)) &&
        (!filters.genre || b.genre === filters.genre) &&
        (!filters.mood || b.mood.includes(filters.mood)) &&
        (!filters.key || b.key === filters.key) &&
        (!filters.bpm ||
          (filters.bpm === "Under 100"
            ? b.bpm < 100
            : filters.bpm === "100–139"
              ? b.bpm >= 100 && b.bpm < 140
              : b.bpm >= 140)) &&
        (!filters.price ||
          (filters.price === "Under $30"
            ? b.startingPrice < 30
            : b.startingPrice >= 30))
      );
    })
    .sort((a, b) =>
      filters.sort === "popular"
        ? b.popularity - a.popularity
        : filters.sort === "price"
          ? a.startingPrice - b.startingPrice
          : beats.indexOf(a) - beats.indexOf(b),
    );
  return (
    <>
      <BeatFilters filters={filters} onChange={setFilters} />
      <div className="results-heading">
        <span aria-live="polite">{visible.length} sounds in the archive</span>
        <span>Find something that feels like you.</span>
      </div>
      <div role="table" aria-label="Beat catalog">
        <div className="beat-row table-heading" role="row">
          <span role="columnheader">TRACK</span>
          <span className="row-genre" role="columnheader">
            GENRE / MOOD
          </span>
          <span className="row-wave" role="columnheader">
            PREVIEW · VISUAL DEMO
          </span>
          <span className="row-bpm" role="columnheader">
            BPM
          </span>
          <span className="row-key" role="columnheader">
            KEY
          </span>
          <span className="row-duration" role="columnheader">
            TIME
          </span>
          <span role="columnheader">FROM</span>
        </div>
        {visible.map((beat, index) => (
          <BeatRow key={beat.id} beat={beat} index={index} />
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <h2>No sounds found.</h2>
          <p>Try a different search or open up your filters.</p>
          <Button onClick={() => setFilters(initialFilters)}>
            Reset filters
          </Button>
        </div>
      )}
      <div className="catalog-end">
        <span>You’ve reached the end of this collection.</span>
        <span>More sounds. Coming soon.</span>
      </div>
    </>
  );
}
