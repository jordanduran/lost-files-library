import { CardSkeletons } from "@/components/ui/loading-indicators";

export default function LoadingPacks() {
  return (
    <section className="pack-storefront page-width">
      <header className="pack-storefront-heading">
        <div>
          <h1>All Packs</h1>
        </div>
      </header>
      <CardSkeletons label="Loading packs" />
    </section>
  );
}
