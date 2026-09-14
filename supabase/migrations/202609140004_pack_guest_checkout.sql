begin;
alter table public.products add column kind text not null default 'beat' check (kind in ('beat','pack'));
alter table public.products add column pack_tracks text[] not null default '{}';
alter table public.orders alter column user_id drop not null;
alter table public.orders add column checkout_email text;
-- Bearer credentials are never exposed through the customer-readable orders table.
create table public.order_access (
  order_id uuid primary key references public.orders(id),
  token text not null unique check (token ~ '^[a-f0-9]{64}$'),
  request_id uuid not null unique,
  revoked_at timestamptz
);
alter table public.order_access enable row level security;
revoke all on public.order_access from public, anon, authenticated;
grant all on public.order_access to service_role;

create function public.create_pack_order(p_user uuid, p_request uuid, p_token text, p_products text[])
returns uuid language plpgsql set search_path = '' as $$
declare result uuid; product public.products; license public.product_licenses; product_id text;
begin
  if p_request is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid checkout'; end if;
  if p_products is null or cardinality(p_products) not between 1 and 20
    or cardinality(p_products) <> (select count(distinct x) from unnest(p_products) x) then raise exception 'Invalid cart'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select a.order_id into result from public.order_access a join public.orders o on o.id=a.order_id
    where a.request_id=p_request and a.token=p_token and o.user_id is not distinct from p_user;
  if result is not null then
    if (select array_agg(i.product_id order by i.product_id) from public.order_items i where i.order_id=result)
      is distinct from (select array_agg(x order by x) from unnest(p_products) x) then raise exception 'Cart changed'; end if;
    return result;
  end if;
  insert into public.orders(user_id,request_id,total_cents,is_test) values(p_user,p_request,0,true) returning id into result;
  insert into public.order_access(order_id,token,request_id) values(result,p_token,p_request);
  for product_id in select unnest(p_products) loop
  select * into product from public.products where id=product_id and published and kind='pack' and cardinality(pack_tracks)>1;
  select * into license from public.product_licenses l where l.product_id=product.id and l.id='pack';
  if product.id is null or license.id is null or license.price_cents<=0 or not exists(
    select 1 from public.product_files f where f.product_id=product.id and license_id=license.id
    and storage_provider='supabase' and bucket='lost-files-demo' and content_type='application/zip'
  ) then raise exception 'Pack unavailable'; end if;
  if p_user is not null and exists(select 1 from public.order_items i join public.orders o on o.id=i.order_id
    where o.user_id=p_user and o.status='paid' and o.is_test and i.product_id=product.id and i.license_id=license.id) then raise exception 'Already purchased'; end if;
  insert into public.order_items(order_id,product_id,license_id,product_title,license_name,license_terms,file_labels,unit_price_cents)
    values(result,product.id,license.id,product.title,license.name,license.description,license.includes,license.price_cents);
  end loop;
  update public.orders set total_cents=(select sum(unit_price_cents) from public.order_items where order_id=result) where id=result;
  return result;
end $$;

create function public.confirm_pack_order(p_order uuid,p_session text,p_total integer,p_currency text,p_email text)
returns void language plpgsql set search_path = '' as $$
declare purchase public.orders;
begin
  select * into purchase from public.orders where id=p_order for update;
  if purchase.id is null or not purchase.is_test or purchase.total_cents is distinct from p_total
    or lower(purchase.currency) is distinct from p_currency or p_session is null or p_session not like 'cs_test_%'
    or (purchase.checkout_session_id is not null and purchase.checkout_session_id<>p_session)
    or not exists(select 1 from public.order_access where order_id=p_order)
    or p_email is null or length(p_email)>320 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'Payment does not match order'; end if;
  if purchase.status='paid' then return; end if;
  if purchase.status<>'pending' then raise exception 'Order cannot be fulfilled'; end if;
  update public.orders set checkout_email=p_email,status='paid',paid_at=now(),checkout_session_id=p_session where id=p_order;
end $$;

create or replace function public.queue_purchase_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recipient text;
begin
  if new.status='paid' and old.status is distinct from 'paid' then
    recipient := new.checkout_email;
    if recipient is null then select email into recipient from auth.users where id=new.user_id; end if;
    if recipient is not null then
      insert into public.purchase_emails(order_id,recipient) values(new.id,recipient) on conflict(order_id) do nothing;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.create_pack_order(uuid,uuid,text,text[]) from public,anon,authenticated;
revoke all on function public.confirm_pack_order(uuid,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.create_pack_order(uuid,uuid,text,text[]) to service_role;
grant execute on function public.confirm_pack_order(uuid,text,integer,text,text) to service_role;
commit;
