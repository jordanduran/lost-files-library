import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function readCityVotes(client: SupabaseClient, userId?: string) {
  const [totals, own] = await Promise.all([
    client.rpc("producer_city_standings"),
    userId ? client.from("producer_city_votes").select("city").eq("user_id",userId) : Promise.resolve({data:[],error:null}),
  ]);
  return {
    standings: totals.error ? null : (totals.data ?? []) as {city:string;votes:number}[],
    votes: own.error ? null : (own.data ?? []).map((row: {city:string})=>row.city),
  };
}
