import type { Metadata } from "next";
import { Dashboard } from "@/components/layout/dashboard";
export const metadata: Metadata = {
  title: "Studio Admin",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <Dashboard admin />;
}
