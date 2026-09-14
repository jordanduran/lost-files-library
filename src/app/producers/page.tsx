import { ProducerAtlas } from "@/components/producers/producer-atlas";
import { createClient } from "@/lib/supabase/server";
import "./producers.css";
export const metadata = {title: "Producers | Lost Files Library", description: "Explore independent sound around the world. Choose the next city for Lost Files Library."};
export default async function ProducersPage() {
  let vote: string | null = null;
  try {
    const client = await createClient();
    if (client) {
      const {data: {user}} = await client.auth.getUser();
      if (user) {
        const {data} = await client.from("producer_city_votes").select("city").eq("user_id",user.id).maybeSingle();
        vote = data?.city ?? null;
      }
    }
  } catch { /* The atlas remains available when voting cannot be loaded. */ }
  return <ProducerAtlas initialVote={vote} />;
}
