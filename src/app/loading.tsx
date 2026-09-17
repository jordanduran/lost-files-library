import { LoadingRing } from "@/components/ui/loading-indicators";
export default function Loading() {
  return (
    <div className="page-width page-intro" role="status" aria-live="polite">
      <p className="loading-inline">
        <LoadingRing /> Opening files…
      </p>
    </div>
  );
}
