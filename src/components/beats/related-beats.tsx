import { beats } from "@/data/mock-beats";
import { BeatCard } from "./beat-card";
export function RelatedBeats({ excludeId }: { excludeId: string }) {
  return (
    <section className="related-section">
      <div className="section-heading">
        <h2>Stay in the feeling.</h2>
        <span className="eyebrow">MORE FROM LOST FILES</span>
      </div>
      <div className="related-grid">
        {beats
          .filter((beat) => beat.id !== excludeId)
          .slice(0, 4)
          .map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
      </div>
    </section>
  );
}
