import type { Metadata } from "next";
import { HackPack } from "@/components/packs/hack-pack";

export const metadata: Metadata = {
  title: "Packs | Archive",
  description: "Vote to unlock the next Archive sound pack.",
};

export default function PacksPage() {
  return (
    <div className="page-width packs-page">
      <header className="page-intro">
        <span className="eyebrow">THE NEXT DROP IS IN YOUR HANDS</span>
        <h1>Hack a pack.</h1>
        <p>Some sounds are locked away. Your vote holds the key.</p>
      </header>
      <HackPack />
      <div className="pack-how">
        <p>
          <span>01</span> Vote for the drop.
        </p>
        <p>
          <span>02</span> Reach the goal. Open the folder.
        </p>
        <p>
          <span>03</span> Purchase. Download. Create.
        </p>
      </div>
    </div>
  );
}
