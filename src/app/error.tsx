"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PageError({ retry }: { retry: () => void }) {
  return (
    <section
      className="page-width page-intro"
      aria-labelledby="page-error-title"
    >
      <title>Page unavailable — Lost Files Library</title>
      <h1 id="page-error-title">We couldn’t load this page.</h1>
      <p role="alert">Something went wrong. Please try again in a moment.</p>
      <div className="error-actions">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href="/recover">Find my purchases</Link>
        <Link href="/">Back to home</Link>
      </div>
    </section>
  );
}
