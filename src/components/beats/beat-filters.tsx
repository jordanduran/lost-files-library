"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { beats } from "@/data/mock-beats";
export type Filters = {
  search: string;
  genre: string;
  mood: string;
  bpm: string;
  key: string;
  price: string;
  sort: string;
};
export const initialFilters: Filters = {
  search: "",
  genre: "",
  mood: "",
  bpm: "",
  key: "",
  price: "",
  sort: "newest",
};
export function BeatFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (value: Filters) => void;
}) {
  const update = (name: keyof Filters, value: string) =>
    onChange({ ...filters, [name]: value });
  const options = {
    genre: [...new Set(beats.map((b) => b.genre))],
    mood: [...new Set(beats.flatMap((b) => b.mood))],
    bpm: ["Under 100", "100–139", "140+"],
    key: [...new Set(beats.map((b) => b.key))],
    price: ["Under $30", "$30 and up"],
  };
  return (
    <div className="catalog-controls">
      <label className="search-field">
        <Search size={20} />
        <input
          id="search"
          type="search"
          placeholder="Search by title, producer, or sound…"
          aria-label="Search beats"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
        />
        <span>EXPLORE LOST FILES</span>
      </label>
      <div className="filter-bar">
        <div className="filter-selects">
          <SlidersHorizontal size={16} />
          {Object.entries(options).map(([name, values]) => (
            <label key={name}>
              <span className="sr-only">{name}</span>
              <select
                aria-label={`Filter by ${name}`}
                value={filters[name as keyof Filters]}
                onChange={(e) => update(name as keyof Filters, e.target.value)}
              >
                <option value="">
                  {name === "bpm"
                    ? "BPM"
                    : name.charAt(0).toUpperCase() + name.slice(1)}
                </option>
                {values.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
          {Object.entries(filters).some(
            ([key, value]) => key !== "sort" && value,
          ) && (
            <button
              className="clear-filters"
              onClick={() => onChange(initialFilters)}
              aria-label="Clear filters"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
        <label className="sort-control">
          Sort by{" "}
          <select
            aria-label="Sort beats"
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price">Price: low to high</option>
          </select>
        </label>
      </div>
    </div>
  );
}
