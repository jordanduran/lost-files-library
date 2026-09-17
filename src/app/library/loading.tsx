import { CardSkeletons } from "@/components/ui/loading-indicators";
import "./library.css";

export default function LoadingLibrary() {
  return (
    <div className="library-browser page-width">
      <div className="library-content">
        <header className="library-heading">
          <div>
            <h1>My Library</h1>
            <p>Your purchased sounds, all in one place.</p>
          </div>
        </header>
        <p className="library-count">Loading purchases…</p>
        <CardSkeletons />
      </div>
    </div>
  );
}
