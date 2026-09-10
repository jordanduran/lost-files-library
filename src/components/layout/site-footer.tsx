import Link from "next/link";
import { brand } from "@/lib/config";
import { ArrowUpRight } from "lucide-react";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/" className="wordmark">
          {brand.name}
        </Link>
        <p>{brand.description}</p>
      </div>
      <div className="footer-links">
        <Link href="/beats">
          Explore sounds <ArrowUpRight size={14} />
        </Link>
        <Link href="/library">My Library</Link>
        <Link href="/admin">Studio admin</Link>
      </div>
      <span className="copyright">
        © {new Date().getFullYear()} {brand.name}
      </span>
    </footer>
  );
}
