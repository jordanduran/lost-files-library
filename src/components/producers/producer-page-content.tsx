"use client";
import { useState } from "react";
import Link from "next/link";
import { ProducerProfile } from "./producer-profile";
import type { Producer } from "@/types/producer";
import type { StorePack } from "@/data/store-packs";
import "@/components/home/archive-home.css";
export function ProducerPageContent({
  producer,
  packs,
  purchasedPackIds,
}: {
  producer: Producer;
  packs: StorePack[];
  purchasedPackIds: string[];
}) {
  const [activePack, setActivePack] = useState<string | null>(null);
  return (
    <section className="producer-profile-page page-width">
      <nav aria-label="Breadcrumb">
        <Link href="/producers">Producers</Link>
        <span> / {producer.name}</span>
      </nav>
      <h1>{producer.name} archive</h1>
      <div className="producer-profile-panel">
        <ProducerProfile
          producer={producer}
          packs={packs}
          purchasedPackIds={purchasedPackIds}
          activePack={activePack}
          onActivePackChange={setActivePack}
        />
      </div>
    </section>
  );
}
