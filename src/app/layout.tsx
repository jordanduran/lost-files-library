import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/lib/config";
import { getUser } from "@/lib/auth";
import "./globals.css";
import "./archive.css";
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
export const metadata: Metadata = {
  title: {
    default: `${brand.name} — Sounds for your next chapter`,
    template: `%s — ${brand.name}`,
  },
  description:
    "Original compositions, beats, and sound packs made for artists and creators.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <SiteShell signedIn={Boolean(user)}>{children}</SiteShell>
      </body>
    </html>
  );
}
