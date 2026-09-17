import { DeliveryTitle } from "@/components/packs/delivery-title";
import Link from "next/link";
import "@/app/downloads/downloads.css";

export function DownloadUnavailable() {
  return (
    <div className="page-width delivery-page">
      <section className="delivery-window">
        <DeliveryTitle />
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
