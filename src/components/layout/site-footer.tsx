import Link from "next/link";
import { brand } from "@/lib/config";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "./brand-logo";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link
          href="/"
          className="wordmark"
          aria-label="Lost Files Library home"
        >
          <BrandLogo library />
        </Link>
        <p>{brand.description}</p>
      </div>
      <div className="footer-links">
        <Link href="/producers">
          Producer archives <ArrowUpRight size={14} />
        </Link>
        <Link href="/library">My Library</Link>
        <Link href="/discover">Discover cities</Link>
        <Link href="/recover">Find my purchases / Help</Link>
      </div>
      <span className="copyright">
        © {new Date().getFullYear()} {brand.name}
      </span>
    </footer>
  );
}
