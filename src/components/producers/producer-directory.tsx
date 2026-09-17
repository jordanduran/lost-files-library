"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Folder, Search, Minus, Square, X } from "lucide-react";
import { useState } from "react";
export function ProducerDirectory({
  producers,
}: {
  producers: { slug: string; name: string; image: string; packCount: number }[];
}) {
  const [query, setQuery] = useState("");
  const visible = producers.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section className="producer-directory page-width">
      <header className="page-intro">
        <span>PRODUCER ARCHIVES</span>
        <h1>Producers.</h1>
        <p>Explore the artists. Open an archive. Find your next sound.</p>
      </header>
      <div className="directory-window-stack">
        <div className="directory-back-window" aria-hidden="true" />
        <div
          className="directory-back-window directory-back-window-front"
          aria-hidden="true"
        />
        <div className="directory-window">
          <div className="directory-window-title">
            <span>
              <Folder size={14} aria-hidden="true" /> Producer archives
            </span>
            <span className="directory-window-controls" aria-hidden="true">
              <Minus size={13} />
              <Square size={11} />
              <X size={13} />
            </span>
          </div>
          <div className="directory-toolbar">
            <span>
              <Folder size={16} /> C:\Lost_Files\Producers
            </span>
            <label>
              <Search size={14} aria-hidden="true" />
              <span className="sr-only">Search producers</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search producers..."
              />
            </label>
          </div>
          <p className="directory-count" role="status">
            {visible.length} {visible.length === 1 ? "producer" : "producers"}
          </p>
          <div className="producer-directory-grid">
            {visible.map((p) => (
              <Link
                className="producer-directory-card"
                href={`/producers/${p.slug}`}
                key={p.slug}
              >
                <div className="directory-portrait">
                  {p.image ? (
                    <Image src={p.image} alt="" fill sizes="64px" />
                  ) : (
                    <div
                      className="directory-portrait-fallback"
                      aria-hidden="true"
                    >
                      <b>
                        {p.name
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join("")}
                      </b>
                    </div>
                  )}
                </div>
                <div className="directory-row-name">
                  <strong>{p.name}</strong>
                  <span>Producer archive</span>
                </div>
                <span className="directory-row-count">
                  {p.packCount} {p.packCount === 1 ? "pack" : "packs"}
                </span>
                <span className="directory-row-open">
                  Open archive <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          {!visible.length && (
            <p className="empty-state">
              {query
                ? "No producers match your search."
                : "Producer archives are coming soon."}
            </p>
          )}
        </div>
      </div>
      <Link className="directory-discover" href="/discover">
        Discover cities and vote for where we go next <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
