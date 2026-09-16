import { ProducerAtlas } from "@/components/producers/producer-atlas";
import { createClient } from "@/lib/supabase/server";
import { readCityVotes } from "@/lib/producer-votes";
import "./discover.css";

export const metadata = {
  title: "Discover",
  description:
    "Explore independent sound around the world. Choose the next cities for Lost Files Library.",
};

export default async function DiscoverPage() {
  let snapshot: {
    votes: string[] | null;
    standings: { city: string; votes: number }[] | null;
  } = { votes: null, standings: null };
  try {
    const client = await createClient();
    if (client) {
      const {
        data: { user },
      } = await client.auth.getUser();
      snapshot = await readCityVotes(client, user?.id);
    }
  } catch {
    /* Keep the atlas usable if the vote service is unavailable. */
  }
  return (
    <ProducerAtlas
      initialVotes={snapshot.votes}
      initialStandings={snapshot.standings}
    />
  );
}
