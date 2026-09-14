import { HardDrive, LockKeyhole } from "lucide-react";
import { premiumPacks } from "@/data/store-packs";
import { PackArt } from "@/components/packs/pack-art";

export const metadata = {
  title: "Hard Drive | Lost Files Library",
  description: "Premium member packs from the Lost Files private archive.",
};

export default function HardDrivePage() {
  return (
    <div className="hard-drive-page page-width">
      <header className="hard-drive-hero">
        <div>
          <HardDrive size={34} />
          <span>MEMBERS_ONLY.DRIVE</span>
        </div>
        <span>PREMIUM ACCESS / LOCKED</span>
        <h1>The Hard Drive.</h1>
        <p>
          A private archive for premium members. Exclusive packs, complete
          sessions, stems, and member-only drops will live here.
        </p>
        <button disabled>
          <LockKeyhole size={14} /> PREMIUM MEMBERSHIP COMING SOON
        </button>
      </header>
      <section
        className="premium-pack-section"
        aria-labelledby="premium-packs-title"
      >
        <div className="premium-section-heading">
          <div>
            <span>ENCRYPTED INVENTORY</span>
            <h2 id="premium-packs-title">Premium packs.</h2>
          </div>
          <span>3 FILES DETECTED / ACCESS DENIED</span>
        </div>
        <div className="store-pack-grid premium-pack-grid">
          {premiumPacks.map((pack) => (
            <article
              className="store-pack-card premium-pack-card"
              key={pack.id}
            >
              <PackArt pack={pack} premium />
              <div className="premium-lock">
                <LockKeyhole size={17} /> MEMBERS ONLY
              </div>
              <div className="store-pack-meta">
                <span>{pack.files} FILES</span>
                <span>{pack.format}</span>
              </div>
              <h3>{pack.title}</h3>
              <p>Details will be decrypted when premium membership launches.</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
