import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/lib/config";
import { getUser } from "@/lib/auth";
import "./globals.css";
import "./archive.css";
import "./file-system.css";
import "./producer-archive.css";
import "./home-intro.css";
import "./responsive-tuning.css";
import "./pack-storefront.css";
import "./pack-explorer.css";
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
export const metadata: Metadata = {
  title: {
    default: `${brand.name} — Sounds for your next chapter`,
    template: `%s — ${brand.name}`,
  },
  description:
    "Vote to hack producer archives and unlock complete sound packs.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <SiteShell signedIn={Boolean(user)} accountEmail={user?.email}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
