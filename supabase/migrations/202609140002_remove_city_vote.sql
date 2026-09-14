begin;
grant delete on public.producer_city_votes to authenticated;
create policy "Remove own city vote" on public.producer_city_votes for delete to authenticated using ((select auth.uid()) = user_id);
commit;
