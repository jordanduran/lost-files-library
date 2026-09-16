"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Folder, Search } from "lucide-react";
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
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="(max-width:560px) 90vw, (max-width:850px) 45vw, 420px"
                />
              ) : (
                <div className="directory-portrait-fallback" aria-hidden="true">
                  <Folder size={24} strokeWidth={1.2} />
                  <b>
                    {p.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")}
                  </b>
                  <small>PRODUCER ARCHIVE</small>
                </div>
              )}
            </div>
            <strong>{p.name}</strong>
            <span>
              {p.packCount} {p.packCount === 1 ? "pack" : "packs"}
              <ArrowUpRight size={16} />
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
      <Link className="directory-discover" href="/discover">
        Discover cities and vote for where we go next <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
