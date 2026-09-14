begin;
-- Read verified identities through these narrowly scoped server-only functions.
-- Do not grant the application's service role direct access to auth.users.
alter function public.is_pack_tester(uuid,text) security definer;
alter function public.tester_pack_ids(uuid) security definer;
alter function public.confirm_pack_order(uuid,text,integer,text,text) security definer;
-- All three functions already use an empty search_path and qualified tables.
revoke all on function public.is_pack_tester(uuid,text),
  public.tester_pack_ids(uuid),
  public.confirm_pack_order(uuid,text,integer,text,text)
  from public,anon,authenticated;
grant execute on function public.is_pack_tester(uuid,text),
  public.tester_pack_ids(uuid),
  public.confirm_pack_order(uuid,text,integer,text,text)
  to service_role;
commit;
