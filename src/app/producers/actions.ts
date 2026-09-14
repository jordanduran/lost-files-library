"use server";
import { createClient } from "@/lib/supabase/server";
import { CITIES } from "@/data/producer-cities";
export async function voteForCity(city: string) {
  if (!CITIES.some(value => value.name === city)) return {error: "Choose a city from the atlas."};
  try {
    const client = await createClient();
    if (!client) return {error: "Voting is temporarily unavailable."};
    const {data: {user}} = await client.auth.getUser();
    if (!user) return {error: "Sign in to save your vote.", needsLogin: true};
    const {error} = await client.from("producer_city_votes").upsert({user_id:user.id, city}, {onConflict:"user_id"});
    if (error) return {error: "Voting is temporarily unavailable. Please try again soon."};
    return {city};
  } catch { return {error: "Could not save your vote. Please try again."}; }
}

export async function removeCityVote() {
  try {
    const client = await createClient();
    if (!client) return {error:"Voting is temporarily unavailable."};
    const {data:{user}}=await client.auth.getUser();
    if(!user) return {error:"Sign in to remove your vote.",needsLogin:true};
    const {error}=await client.from("producer_city_votes").delete().eq("user_id",user.id);
    if(error) return {error:"Could not remove your vote. Please try again."};
    return {removed:true};
  } catch {return {error:"Could not remove your vote. Please try again."};}
}
