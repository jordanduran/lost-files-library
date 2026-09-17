import { CardSkeletons, LoadingRing } from "@/components/ui/loading-indicators";
export const metadata = {
  title: "Loading concepts",
  robots: { index: false, follow: false },
};

export default function LoadingPreview() {
  return (
    <div className="page-width loading-preview">
      <h1>Loading states</h1>
      <p>
        Preview only. Both examples stay visible so you can compare them; no
        purchase or download is running.
      </p>
      <section className="loading-preview-section">
        <h2>01 / Thin blue ring</h2>
        <div className="loading-preview-button">
          <LoadingRing /> Preparing download…
        </div>
      </section>
      <section className="loading-preview-section">
        <h2>02 / Midnight card skeletons</h2>
        <CardSkeletons />
      </section>
    </div>
  );
}
