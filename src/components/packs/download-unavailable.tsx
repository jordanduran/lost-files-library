import Link from "next/link";
import "@/app/downloads/downloads.css";

export function DownloadUnavailable() {
  return (
    <div className="page-width delivery-page">
      <section className="delivery-window">
        <div className="delivery-title">
          C:&#92;LOST_FILES&#92;DOWNLOADS
          <span className="delivery-controls" aria-hidden="true">
            <span>&minus;</span>
            <span>&#9633;</span>
            <span>&times;</span>
          </span>
        </div>
        <div className="delivery-body">
          <span className="eyebrow">DOWNLOAD HELP</span>
          <h1>This download is unavailable.</h1>
          <p>
            We couldn’t open this link. Check that you copied the complete link
            from your purchase email, or find your available purchases below.
          </p>
          <div className="delivery-actions">
            <Link className="delivery-button" href="/recover">
              Find my purchases
            </Link>
            <Link className="delivery-button" href="/library">
              My Library
            </Link>
          </div>
          <p className="delivery-note">
            Use your checkout email to recover available purchases. Recovery
            won’t restore access to refunded or revoked purchases.
          </p>
        </div>
      </section>
    </div>
  );
}
