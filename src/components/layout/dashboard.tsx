"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Home,
  Library,
  Heart,
  ShoppingBag,
  User,
  LayoutDashboard,
  Disc3,
  Users,
  Upload,
  ArrowUpRight,
  Download,
  Plus,
  ArrowDownToLine,
} from "lucide-react";
import { beats } from "@/data/mock-beats";
import { Artwork } from "@/components/beats/artwork";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { money } from "@/lib/utils";
export function Dashboard({ admin = false }: { admin?: boolean }) {
  const [section, setSection] = useState(admin ? "Overview" : "My Library");
  const nav = admin
    ? [
        { name: "Overview", icon: LayoutDashboard },
        { name: "Products", icon: Disc3 },
        { name: "Orders", icon: ShoppingBag },
        { name: "Customers", icon: Users },
        { name: "Uploads", icon: Upload },
      ]
    : [
        { name: "Home", icon: Home },
        { name: "My Library", icon: Library },
        { name: "Favorites", icon: Heart },
        { name: "Orders", icon: ShoppingBag },
        { name: "Account", icon: User },
      ];
  const mainView = admin
    ? ["Overview", "Products"].includes(section)
    : section === "My Library";
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <span className="eyebrow">
          {admin ? "STUDIO WORKSPACE" : "YOUR COLLECTION"}
        </span>
        <nav aria-label={admin ? "Admin navigation" : "Library navigation"}>
          {nav.map(({ name, icon: Icon }) =>
            name === "Home" ? (
              <Link href="/" key={name}>
                <Icon size={17} />
                {name}
              </Link>
            ) : (
              <button
                key={name}
                className={section === name ? "selected" : ""}
                aria-current={section === name ? "page" : undefined}
                onClick={() => setSection(name)}
              >
                <Icon size={17} />
                {name}
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{admin ? "A" : "J"}</span>
          <div>
            <strong>{admin ? "Archive Studio" : "Demo account"}</strong>
            <p>{admin ? "Admin preview" : "Library preview"}</p>
          </div>
        </div>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {admin
                ? "A LITTLE OVERVIEW OF EVERYTHING."
                : "KEEP THE INSPIRATION CLOSE."}
            </span>
            <h1>
              {admin && section === "Overview" ? "Studio overview." : section}
            </h1>
            <p>
              {admin
                ? "Your sounds. Your business. All in one place."
                : "Your purchases, ready to download."}
            </p>
          </div>
          {admin ? (
            <Notice
              title="Your next release starts here"
              description="Product creation and uploads will be available when the backend is connected. This preview does not upload or store files."
            >
              <Button>
                <Plus /> Add Product
              </Button>
            </Notice>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/beats">
                Explore beats <ArrowUpRight />
              </Link>
            </Button>
          )}
        </div>
        <div className="preview-banner">
          {admin
            ? "Admin preview — sample metrics and products. No live orders or revenue."
            : "Sample library — these entries demonstrate purchased products. Downloads are not enabled."}
        </div>
        {admin && section === "Overview" && (
          <div className="stats-grid">
            {[
              ["Total Products", "24", "8 preview products shown"],
              ["Orders", "128", "This month · sample"],
              ["Revenue", "$4,862", "This month · sample"],
              ["Downloads", "386", "All time · sample"],
            ].map(([label, value, note]) => (
              <div className="stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
        )}
        {mainView ? (
          <section className="dashboard-table-section">
            <div className="section-heading">
              <h2>
                {admin ? "Recent products" : "Purchased sounds"}{" "}
                <span className="count-badge">{admin ? beats.length : 3}</span>
              </h2>
              <span className="eyebrow">
                {admin ? "YOUR CATALOG" : "ALL PURCHASES"}
              </span>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>TRACK</th>
                    <th>{admin ? "STATUS" : "PURCHASED"}</th>
                    <th>{admin ? "GENRE" : "LICENSE"}</th>
                    <th>{admin ? "PRICE" : "FILES"}</th>
                    <th>{admin ? "PRODUCT" : "DOWNLOAD"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(admin ? beats : [beats[0], beats[2], beats[6]]).map(
                    (beat, i) => (
                      <tr key={beat.id}>
                        <td>
                          <div className="dashboard-track">
                            <Artwork kind={beat.artwork} title={beat.title} />
                            <div>
                              <Link href={`/beats/${beat.slug}`}>
                                {beat.title}
                              </Link>
                              <p>{beat.producer}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {admin ? (
                            <span className="published">Published</span>
                          ) : (
                            `Sep ${String(8 - i * 2).padStart(2, "0")}, 2026`
                          )}
                        </td>
                        <td>{admin ? beat.genre : beat.licenses[i].name}</td>
                        <td>
                          {admin
                            ? money(beat.startingPrice)
                            : ["MP3", "WAV", "WAV + ZIP"][i]}
                        </td>
                        <td>
                          {admin ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/beats/${beat.slug}`}>
                                View <ArrowUpRight />
                              </Link>
                            </Button>
                          ) : (
                            <Notice
                              title="Downloads are not enabled yet"
                              description="This is a sample purchased item. Secure downloads will be available after account and purchase verification are connected."
                            >
                              <Button variant="outline" size="sm">
                                <Download /> <span>Download</span>
                              </Button>
                            </Notice>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="empty-state dashboard-empty">
            <ArrowDownToLine size={28} />
            <h2>
              {section === "Favorites"
                ? "Save the sounds that stay with you."
                : `${section}, coming soon.`}
            </h2>
            <p>
              {section === "Orders"
                ? "Order history will appear here when purchases are available."
                : section === "Uploads"
                  ? "A dedicated home for your artwork, previews, and release files."
                  : section === "Account"
                    ? "Profile and account settings will be available when sign-in is connected."
                    : section === "Customers"
                      ? "Customer information will appear here once your store is connected."
                      : "Your personal favorites collection will be available with accounts."}
            </p>
            <Button
              variant="outline"
              onClick={() => setSection(admin ? "Overview" : "My Library")}
            >
              Back to {admin ? "overview" : "library"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
