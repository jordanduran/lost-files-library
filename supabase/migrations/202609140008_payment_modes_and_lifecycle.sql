-- Run once after migrations 006 and 007, before deploying the matching app code.
-- Preserves purchases. All products start with live sales disabled.
-- Does not change Stripe keys, enable live checkout, or issue refunds.
begin;
alter table public.products add column live_ready boolean not null default false;
alter table public.products add constraint live_pack_release check (not live_ready or (kind='pack' and published and not test_restricted));
alter table public.orders add column delivery_bucket text not null default 'lost-files-demo';
update public.orders set delivery_bucket='lost-files-releases' where not is_test;
alter table public.orders add constraint order_storage_mode check (delivery_bucket=case when is_test then 'lost-files-demo' else 'lost-files-releases' end);
alter table public.orders add column payment_intent_id text unique;
alter table public.orders add column refunded_cents integer not null default 0 check(refunded_cents>=0 and refunded_cents<=total_cents);
alter table public.orders add column dispute_id text unique;
alter table public.orders add column dispute_status text check(dispute_status in ('open','won','lost'));
create function public.create_store_order(p_user uuid, p_request uuid, p_token text, p_products text[], p_test boolean)
returns uuid language plpgsql set search_path = '' as $$
declare target_bucket text; result uuid; product public.products; license public.product_licenses; product_id text;
begin
  if p_test is null then raise exception 'Invalid mode'; end if;
  target_bucket := case when p_test then 'lost-files-demo' else 'lost-files-releases' end;
  if p_request is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid checkout'; end if;
  if p_products is null or cardinality(p_products) not between 1 and 20
    or cardinality(p_products) <> (select count(distinct x) from unnest(p_products) x) then raise exception 'Invalid cart'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select a.order_id into result from public.order_access a join public.orders o on o.id=a.order_id
    where a.request_id=p_request and a.token=p_token and o.user_id is not distinct from p_user;
  if result is not null then
    if (select array_agg(i.product_id order by i.product_id) from public.order_items i where i.order_id=result)
      is distinct from (select array_agg(x order by x) from unnest(p_products) x) then raise exception 'Cart changed'; end if;
    if (select is_test from public.orders where id=result) is distinct from p_test then raise exception 'Mode changed'; end if;
    if not public.test_order_allowed(result) then raise exception 'Tester access required'; end if;
    return result;
  end if;
  insert into public.orders(user_id,request_id,total_cents,is_test,delivery_bucket) values(p_user,p_request,0,p_test,target_bucket) returning id into result;
  insert into public.order_access(order_id,token,request_id) values(result,p_token,p_request);
  for product_id in select unnest(p_products) loop
  select * into product from public.products where id=product_id and kind='pack' and cardinality(pack_tracks)>1;
  if product.id is not null then
    if not p_test and (not product.live_ready or product.test_restricted or not product.published) then raise exception 'Pack unavailable'; end if;
    if product.test_restricted then
      if not public.is_pack_tester(p_user,product.id) then raise exception 'Tester access required'; end if;
      update public.orders set test_product_ids=array_append(test_product_ids,product.id) where id=result;
    elsif not product.published then raise exception 'Pack unavailable'; end if;
  end if;
  select * into license from public.product_licenses l where l.product_id=product.id and l.id='pack';
  if product.id is null or license.id is null or license.price_cents<=0 or not exists(
    select 1 from public.product_files f where f.product_id=product.id and license_id=license.id
    and storage_provider='supabase' and bucket=target_bucket and content_type='application/zip'
  ) then raise exception 'Pack unavailable'; end if;
  if p_user is not null and exists(select 1 from public.order_items i join public.orders o on o.id=i.order_id
    where o.user_id=p_user and o.status='paid' and o.is_test=p_test and i.product_id=product.id and i.license_id=license.id) then raise exception 'Already purchased'; end if;
  insert into public.order_items(order_id,product_id,license_id,product_title,license_name,license_terms,file_labels,unit_price_cents)
    values(result,product.id,license.id,product.title,license.name,license.description,license.includes,license.price_cents);
  end loop;
  update public.orders set total_cents=(select sum(unit_price_cents) from public.order_items where order_id=result) where id=result;
  return result;
end $$;


create function public.confirm_store_order(p_order uuid,p_session text,p_total integer,p_currency text,p_email text,p_test boolean,p_payment_intent text)
returns void language plpgsql security definer set search_path='' as $$
declare purchase public.orders;
begin
 select * into purchase from public.orders where id=p_order for update;
 if purchase.id is null or p_test is null or purchase.is_test is distinct from p_test
 or purchase.total_cents is distinct from p_total or lower(purchase.currency) is distinct from p_currency
 or p_session is null or not (p_session like case when p_test then 'cs_test_%' else 'cs_live_%' end)
 or (purchase.checkout_session_id is not null and purchase.checkout_session_id<>p_session)
 or (p_payment_intent is not null and p_payment_intent !~ '^pi_[a-zA-Z0-9]+$')
 or (not p_test and p_payment_intent is null)
 or (purchase.payment_intent_id is not null and purchase.payment_intent_id is distinct from p_payment_intent)
 or not exists(select 1 from public.order_access where order_id=p_order)
 or p_email is null or length(p_email)>320 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 then raise exception 'Payment does not match order'; end if;
 if cardinality(purchase.test_product_ids)>0 then
   if not p_test or not public.test_order_allowed(p_order) then raise exception 'Tester access required'; end if;
   select email into p_email from auth.users where id=purchase.user_id;
 end if;
 -- Financial blocks survive delayed/repeated completion webhooks.
 if purchase.paid_at is not null then return; end if;
 if purchase.status not in ('pending','refunded','disputed') then raise exception 'Order cannot be fulfilled'; end if;
 update public.orders set checkout_email=p_email,paid_at=now(),checkout_session_id=p_session,
 payment_intent_id=p_payment_intent,
 status=case when refunded_cents>0 or status='refunded' then 'refunded'
   when dispute_status in ('open','lost') or status='disputed' then 'disputed' else 'paid' end
 where id=p_order;
end $$;

create function public.apply_order_payment_event(p_order uuid,p_session text,p_payment_intent text,p_test boolean,p_total integer,p_currency text,p_refunded integer,p_dispute text,p_dispute_status text)
returns void language plpgsql set search_path='' as $$
declare purchase public.orders; next_dispute text;
begin
 select * into purchase from public.orders where id=p_order for update;
 if purchase.id is null or p_test is null or purchase.is_test is distinct from p_test
 or p_total is distinct from purchase.total_cents or p_currency is distinct from lower(purchase.currency)
 or p_session is null or not (p_session like case when p_test then 'cs_test_%' else 'cs_live_%' end)
 or (purchase.checkout_session_id is not null and purchase.checkout_session_id<>p_session)
 or p_payment_intent is null or p_payment_intent !~ '^pi_[a-zA-Z0-9]+$'
 or (purchase.payment_intent_id is not null and purchase.payment_intent_id<>p_payment_intent)
 or p_refunded is null or p_refunded<0 or p_refunded>p_total
 or ((p_dispute is null) <> (p_dispute_status is null))
 or (p_dispute is not null and (p_dispute !~ '^du_[a-zA-Z0-9]+$' or p_dispute_status not in ('open','won','lost')))
 or (purchase.dispute_id is not null and p_dispute is not null and purchase.dispute_id<>p_dispute)
 then raise exception 'Payment event does not match order'; end if;
 -- Closed disputes cannot be reopened by an older delivery. Refunds never decrease.
 next_dispute := case when purchase.dispute_status='lost' or p_dispute_status='lost' then 'lost' when purchase.dispute_status='won' then 'won' else coalesce(p_dispute_status,purchase.dispute_status) end;
 update public.orders set payment_intent_id=p_payment_intent,checkout_session_id=p_session,
 refunded_cents=greatest(refunded_cents,p_refunded),dispute_id=coalesce(dispute_id,p_dispute),dispute_status=next_dispute,
 status=case when greatest(refunded_cents,p_refunded)>0 or status='refunded' then 'refunded'
 when next_dispute in ('open','lost') then 'disputed'
 when next_dispute='won' and status='disputed' then case when paid_at is null then 'pending' else 'paid' end
 when paid_at is not null and status='paid' then 'paid' else status end
 where id=p_order;
end $$;

revoke all on function public.create_store_order(uuid,uuid,text,text[],boolean),public.confirm_store_order(uuid,text,integer,text,text,boolean,text),public.apply_order_payment_event(uuid,text,text,boolean,integer,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.create_store_order(uuid,uuid,text,text[],boolean),public.confirm_store_order(uuid,text,integer,text,text,boolean,text),public.apply_order_payment_event(uuid,text,text,boolean,integer,text,integer,text,text) to service_role;
commit;
