import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="empty-state page-width">
      <span className="eyebrow">404 / OFF THE RECORD</span>
      <h1>This sound isn’t here.</h1>
      <p>Let’s find you a new starting point.</p>
      <Button asChild>
        <Link href="/beats">Explore the archive</Link>
      </Button>
    </div>
  );
}
