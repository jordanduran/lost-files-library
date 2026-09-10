import type { Metadata } from "next";
import { Dashboard } from "@/components/layout/dashboard";
export const metadata: Metadata = { title: "My Library" };
export default function LibraryPage() {
  return <Dashboard />;
}
