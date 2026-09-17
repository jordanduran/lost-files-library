import "./loading-indicators.css";

export function LoadingRing() {
  return <span className="loading-ring" aria-hidden="true" />;
}

export function CardSkeletons({
  label = "Loading your purchases",
}: {
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <div className="loading-card-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="loading-card" key={index}>
            <div className="loading-card-cover loading-pulse" />
            <div className="loading-card-copy">
              <span className="loading-line loading-pulse" />
              <span className="loading-line loading-line-short loading-pulse" />
              <span className="loading-line loading-line-short loading-pulse" />
              <span className="loading-line loading-line-action loading-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
