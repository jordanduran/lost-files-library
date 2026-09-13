begin;
alter table public.orders add column request_id uuid;
alter table public.orders add column is_test boolean not null default false;
create unique index orders_request on public.orders(user_id, request_id);

-- Only the server can create price snapshots or confirm a payment.
create function public.create_test_order(p_user uuid, p_request uuid, p_items jsonb)
returns uuid language plpgsql set search_path = '' as $$
declare result uuid; item jsonb; product public.products; license public.product_licenses;
begin
  if p_user is null or p_request is null or p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid cart';
  end if;
  if jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Invalid cart';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  select id into result from public.orders where user_id = p_user and request_id = p_request;
  if result is not null then
    if (select jsonb_agg(jsonb_build_object('beatId', product_id, 'licenseId', license_id) order by product_id, license_id) from public.order_items where order_id = result)
      <> (select jsonb_agg(value order by value->>'beatId', value->>'licenseId') from jsonb_array_elements(p_items)) then
      raise exception 'Cart changed';
    end if;
    return result;
  end if;
  insert into public.orders(user_id, request_id, total_cents, is_test) values(p_user, p_request, 0, true) returning id into result;
  for item in select value from jsonb_array_elements(p_items) loop
    select * into product from public.products where id = item->>'beatId' and published;
    select * into license from public.product_licenses where product_id = product.id and id = item->>'licenseId';
    if product.id is null or license.id is null or license.price_cents <= 0 then raise exception 'Product unavailable'; end if;
    if exists(select 1 from public.orders o join public.order_items i on i.order_id = o.id where o.user_id = p_user and o.status = 'paid' and i.product_id = product.id and i.license_id = license.id) then
      raise exception 'Already purchased';
    end if;
    insert into public.order_items(order_id, product_id, license_id, product_title, license_name, license_terms, file_labels, unit_price_cents)
      values(result, product.id, license.id, product.title, license.name, license.description, license.includes, license.price_cents);
  end loop;
  update public.orders set total_cents = (select sum(unit_price_cents) from public.order_items where order_id = result) where id = result;
  return result;
end $$;

create function public.confirm_test_order(p_order uuid, p_user uuid, p_session text, p_total integer, p_currency text)
returns void language plpgsql set search_path = '' as $$
declare purchase public.orders;
begin
  select * into purchase from public.orders where id = p_order for update;
  if purchase.id is null or purchase.user_id is distinct from p_user or not purchase.is_test
    or purchase.total_cents is distinct from p_total or lower(purchase.currency) is distinct from p_currency
    or p_session is null or p_session not like 'cs_test_%'
    or (purchase.checkout_session_id is not null and purchase.checkout_session_id <> p_session) then
    raise exception 'Payment does not match order';
  end if;
  if purchase.status = 'paid' then return; end if;
  if purchase.status <> 'pending' then raise exception 'Order cannot be fulfilled'; end if;
  update public.orders set status = 'paid', paid_at = now(), checkout_session_id = p_session where id = p_order;
end $$;
revoke all on function public.create_test_order(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.confirm_test_order(uuid, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.create_test_order(uuid, uuid, jsonb) to service_role;
grant execute on function public.confirm_test_order(uuid, uuid, text, integer, text) to service_role;
commit;
