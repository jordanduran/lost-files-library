begin;
-- Preserve existing votes; allow one vote per account for each city.
alter table public.producer_city_votes drop constraint producer_city_votes_pkey;
alter table public.producer_city_votes add primary key (user_id, city);
revoke update on public.producer_city_votes from authenticated;
drop policy if exists "Change own city vote" on public.producer_city_votes;
grant delete on public.producer_city_votes to authenticated;
drop policy if exists "Remove own city vote" on public.producer_city_votes;
create policy "Remove own city vote" on public.producer_city_votes for delete to authenticated using ((select auth.uid()) = user_id);
create index producer_city_votes_city_idx on public.producer_city_votes(city);
-- Only aggregate counts are public. Account identities stay behind RLS.
create function public.producer_city_standings() returns table(city text, votes bigint)
language sql stable security definer set search_path = '' as $$
  select city, count(*) from public.producer_city_votes group by city;
$$;
revoke all on function public.producer_city_standings() from public;
grant execute on function public.producer_city_standings() to anon, authenticated, service_role;
commit;
