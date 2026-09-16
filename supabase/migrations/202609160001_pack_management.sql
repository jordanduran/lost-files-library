begin;
-- Public presentation metadata only. Private object keys remain in product_files.
create table public.pack_listings (
  product_id text primary key references public.products(id),
  details jsonb not null check (jsonb_typeof(details)='object'),
  featured boolean not null default false,
  sort_order integer not null default 0,
  revision integer not null default 1
);
create unique index one_featured_pack on public.pack_listings(featured) where featured;
alter table public.pack_listings enable row level security;
revoke all on public.pack_listings from public,anon,authenticated;
grant select on public.pack_listings to anon,authenticated;
grant all on public.pack_listings to service_role;
create policy "Published pack presentation" on public.pack_listings for select to anon,authenticated
using (exists(select 1 from public.products p where p.id=product_id and p.published));

-- Server actions verify the admin identity first. No browser can execute this RPC.
create function public.save_managed_pack(p jsonb) returns integer
language plpgsql set search_path='' as $$
declare current_revision integer; next_revision integer; f jsonb; previous_key text;
begin
  perform pg_advisory_xact_lock(716001001);
  select revision into current_revision from public.pack_listings where product_id=p->>'id' for update;
  if coalesce(current_revision,0) <> (p->>'revision')::integer then raise exception 'This pack changed. Reload before saving.'; end if;
  if exists(select 1 from public.products where id=p->>'id' and kind<>'pack') then raise exception 'Only packs can be managed here.'; end if;
  if p->>'status' not in ('draft','testers','published') or (p->>'priceCents')::integer < 50 then raise exception 'Invalid pack settings'; end if;
  -- Existing product URLs stay stable, including emailed and shared links.
  if exists(select 1 from public.products where id=p->>'id' and slug<>p->>'slug') then raise exception 'An existing pack URL cannot be changed.'; end if;
  insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork,kind,pack_tracks,published,test_restricted,live_ready)
  values(p->>'id',p->>'slug',p->>'title',p->>'producer','Pack',null,'Mixed',1,p->'details'->>'cover','pack',
    array(select t->>'title' from jsonb_array_elements(p->'details'->'tracks') t),p->>'status'='published',p->>'status'='testers',(p->>'liveReady')::boolean)
  on conflict(id) do update set title=excluded.title,producer=excluded.producer,artwork=excluded.artwork,pack_tracks=excluded.pack_tracks,
    published=excluded.published,test_restricted=excluded.test_restricted,live_ready=excluded.live_ready;
  insert into public.product_licenses(product_id,id,name,description,includes,price_cents)
  values(p->>'id','pack',p->>'licenseName',p->>'licenseTerms',array['Complete pack ZIP','License'],(p->>'priceCents')::integer)
  on conflict(product_id,id) do update set name=excluded.name,description=excluded.description,price_cents=excluded.price_cents;
  -- ZIP references are immutable here. Unpublishing never deletes buyers' files.
  for f in select value from jsonb_array_elements(p->'files') loop
    select object_key into previous_key from public.product_files where product_id=p->>'id' and license_id='pack' and bucket=f->>'bucket' and content_type='application/zip';
    if previous_key is not null and previous_key<>f->>'object_key' then raise exception 'A saved ZIP cannot be replaced. Create a new pack version.'; end if;
    if previous_key is null then
      insert into public.product_files(product_id,license_id,storage_provider,bucket,object_key,download_name,content_type,size_bytes)
      values(p->>'id','pack','supabase',f->>'bucket',f->>'object_key',f->>'download_name','application/zip',(f->>'size_bytes')::bigint);
    end if;
  end loop;
  if (p->>'featured')::boolean then update public.pack_listings set featured=false,revision=revision+1 where featured and product_id<>p->>'id'; end if;
  next_revision := coalesce(current_revision,0)+1;
  insert into public.pack_listings values(p->>'id',p->'details',(p->>'featured')::boolean,(p->>'sortOrder')::integer,next_revision)
  on conflict(product_id) do update set details=excluded.details,featured=excluded.featured,sort_order=excluded.sort_order,revision=excluded.revision;
  return next_revision;
end $$;
revoke all on function public.save_managed_pack(jsonb) from public,anon,authenticated;
grant execute on function public.save_managed_pack(jsonb) to service_role;
commit;
