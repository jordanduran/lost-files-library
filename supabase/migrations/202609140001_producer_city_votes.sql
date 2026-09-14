begin;
create table public.producer_city_votes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  city text not null check (city in ('LOS ANGELES','NEW YORK','LONDON','LAGOS','SÃO PAULO','JOHANNESBURG','MUMBAI','TOKYO','SYDNEY'))
);
alter table public.producer_city_votes enable row level security;
revoke all on public.producer_city_votes from anon, authenticated;
grant select, insert, update on public.producer_city_votes to authenticated;
grant all on public.producer_city_votes to service_role;
create policy "Read own city vote" on public.producer_city_votes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Cast own city vote" on public.producer_city_votes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Change own city vote" on public.producer_city_votes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
