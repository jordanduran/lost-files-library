"use server";
import { createClient } from "@/lib/supabase/server";
import { CITIES } from "@/data/producer-cities";
import { readCityVotes } from "@/lib/producer-votes";
export async function setCityVote(city: string, enabled: boolean) {
  if (
    !CITIES.some((value) => value.name === city) ||
    typeof enabled !== "boolean"
  )
    return { error: "Choose a city from the atlas." };
  try {
    const client = await createClient();
    if (!client) return { error: "Voting is temporarily unavailable." };
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return { error: "Sign in to save your votes.", needsLogin: true };
    // Check schema readiness before writes, including deletion, during rollout.
    const ready = await client.rpc("producer_city_standings");
    if (ready.error)
      return {
        error: "Voting is temporarily unavailable. Please try again soon.",
      };
    const { error } = enabled
      ? await client
          .from("producer_city_votes")
          .upsert(
            { user_id: user.id, city },
            { onConflict: "user_id,city", ignoreDuplicates: true },
          )
      : await client
          .from("producer_city_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("city", city);
    if (error) return { error: "Could not save your vote. Please try again." };
    const snapshot = await readCityVotes(client, user.id);
    return { saved: true, city, enabled, ...snapshot };
  } catch {
    return { error: "Connection interrupted. Please try again." };
  }
}
