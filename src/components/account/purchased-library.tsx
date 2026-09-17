"use client";

import Link from "next/link";
import { PackArt } from "@/components/packs/pack-art";
import type { StorePack } from "@/data/store-packs";
import { useState } from "react";
import { Library, ArrowUpRight, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/lib/library";

type Artwork = Record<
  string,
  { cover: string; producer: string; art: StorePack["art"] }
>;

export function PurchasedLibrary({
  items,
  unavailable,
  artwork = {},
}: {
  items: LibraryItem[];
  unavailable?: boolean;
  artwork?: Artwork;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("grid");
  const visible = items
    .filter((item) =>
      `${item.product_title} ${artwork[item.id]?.producer ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.product_title.localeCompare(b.product_title)
        : Date.parse(b.orders.paid_at) - Date.parse(a.orders.paid_at),
    );

  return (
    <div className="library-browser page-width">
      <div className="library-content">
        <header className="library-heading">
          <div>
            <h1>My Library</h1>
            <p>Your purchased sounds, all in one place.</p>
          </div>
          {!unavailable && items.length > 0 && (
            <div className="library-controls">
              <label className="library-search">
                <Search size={14} aria-hidden="true" />
                <input
                  aria-label="Search your purchases"
                  placeholder="Search your files…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                />
              </label>
              <select
                aria-label="Sort purchases"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recent">Recent first</option>
                <option value="name">Name A–Z</option>
              </select>
              <div
                className="library-view"
                role="group"
                aria-label="Library view"
              >
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          )}
        </header>
        {unavailable ? (
          <div className="empty-state" role="alert">
            <h2>We could not load your library.</h2>
            <p>Your purchases have not changed. Please try again.</p>
            <Button asChild variant="outline">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Reload a failed server query. */}
              <a href="/library">Try again</a>
            </Button>
          </div>
        ) : !items.length ? (
          <div className="empty-state">
            <Library size={28} />
            <h2>Your library starts here.</h2>
            <p>Once you purchase a sound, it will appear here.</p>
            <Button asChild>
              <Link href="/packs">
                Browse Packs <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="library-count" role="status">
              {visible.length} {visible.length === 1 ? "purchase" : "purchases"}
            </p>
            {visible.length === 0 ? (
              <div className="empty-state">
                <h2>No matching purchases.</h2>
                <button className="text-link" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </div>
            ) : (
              <section
                className="library-grid"
                data-view={view}
                aria-label="Purchased sounds"
              >
                {visible.map((item) => (
                  <Link
                    className="library-card"
                    key={item.id}
                    href={`/library/${item.id}`}
                  >
                    <div className="library-cover">
                      <PackArt
                        pack={{
                          id: item.product_id ?? item.id,
                          title: item.product_title,
                          cover: artwork[item.id]?.cover,
                          art: artwork[item.id]?.art ?? "signal",
                        }}
                      />
                    </div>
                    <div className="library-card-copy">
                      <h2>{item.product_title}</h2>
                      {artwork[item.id]?.producer && (
                        <p>{artwork[item.id].producer}</p>
                      )}
                      <p>{item.license_name}</p>
                      <p className="library-file-labels">
                        {item.file_labels.join(" / ")}
                      </p>
                      <time dateTime={item.orders.paid_at}>
                        {new Date(item.orders.paid_at).toLocaleDateString(
                          "en-US",
                          { timeZone: "UTC" },
                        )}
                      </time>
                      <span className="library-download">
                        View downloads{" "}
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </>
        )}
        <p className="library-recovery">
          <Link href="/recover">Missing a purchase?</Link>
        </p>
      </div>
    </div>
  );
}
