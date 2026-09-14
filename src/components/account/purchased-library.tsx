import Link from "next/link";
import { Library, User, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/lib/library";

export function PurchasedLibrary({
  email,
  items,
  unavailable,
}: {
  email: string;
  items: LibraryItem[];
  unavailable?: boolean;
}) {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <span className="eyebrow">LIBRARY / FILE CABINET</span>
        <nav aria-label="Library navigation">
          <Link href="/library" className="selected" aria-current="page">
            <Library size={17} />
            My Library
          </Link>
          <Link href="/account">
            <User size={17} />
            Account
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <p className="account-email">{email}</p>
        </div>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">PERSONAL ARCHIVE / PURCHASED FILES</span>
            <h1>My Library</h1>
            <p>Your purchased sounds, all in one place.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/beats">
              Explore beats <ArrowUpRight />
            </Link>
          </Button>
        </div>
        {unavailable ? (
          <div className="empty-state" role="alert">
            <h2>We could not load your library.</h2>
            <p>Your purchases have not changed. Please try again.</p>
            <Button asChild variant="outline">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Retry must reload a failed server query. */}
              <a href="/library">Try again</a>
            </Button>
          </div>
        ) : !items.length ? (
          <div className="empty-state">
            <Library size={28} />
            <h2>Your library starts here.</h2>
            <p>Once you purchase a sound, it will appear here.</p>
            <Button asChild>
              <Link href="/beats">
                Browse Beats <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : (
          <section className="dashboard-table-section">
            <div className="section-heading">
              <h2>
                Purchased sounds{" "}
                <span className="count-badge">{items.length}</span>
              </h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>TRACK</th>
                    <th>PURCHASED</th>
                    <th>LICENSE</th>
                    <th>FILES</th>
                    <th>DOWNLOAD</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_title}</td>
                      <td>
                        {new Date(item.orders.paid_at).toLocaleDateString(
                          "en-US",
                          { timeZone: "UTC" },
                        )}
                      </td>
                      <td>{item.license_name}</td>
                      <td>{item.file_labels.join(" / ")}</td>
                      <td>
                        <Link className="text-link" href={`/library/${item.id}`}>View downloads</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
