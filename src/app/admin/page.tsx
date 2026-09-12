import type { Metadata } from "next";
import { Dashboard } from "@/components/layout/dashboard";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
export const metadata: Metadata = {
  title: "Studio Admin",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const user = await requireUser();
  if (user.app_metadata.role !== "admin") notFound();
  return <Dashboard admin />;
}
