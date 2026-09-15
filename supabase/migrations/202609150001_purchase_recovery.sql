begin;
-- Server-only rate limits. Keys are HMAC hashes, never raw emails or IPs.
create table public.purchase_recovery_limits (
  key text primary key,
  started_at timestamptz not null,
  last_at timestamptz not null,
  requests integer not null
);
alter table public.purchase_recovery_limits enable row level security;
revoke all on public.purchase_recovery_limits from public, anon, authenticated;
grant all on public.purchase_recovery_limits to service_role;

create function public.request_purchase_recovery(p_email text,p_email_hash text,p_ip_hash text)
returns table(order_id uuid,token text,recipient text,is_test boolean,titles text[])
language plpgsql set search_path='' as $$
declare rate_key text; max_requests integer; previous public.purchase_recovery_limits;
begin
  if p_email is null or length(p_email)>320 or p_email<>lower(btrim(p_email))
    or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then return; end if;
  -- Serialize the small limit update so concurrent requests cannot oversend.
  perform pg_advisory_xact_lock(715009001);
  delete from public.purchase_recovery_limits where last_at<now()-interval '1 day';
  foreach rate_key in array array['global','ip:'||p_ip_hash,'email:'||p_email_hash] loop
    max_requests := case when rate_key='global' then 100 when rate_key like 'ip:%' then 10 else 3 end;
    select * into previous from public.purchase_recovery_limits where key=rate_key;
    if previous.started_at>now()-interval '1 hour' and previous.requests>=max_requests then return; end if;
    if rate_key like 'email:%' and previous.last_at>now()-interval '60 seconds' then return; end if;
  end loop;
  foreach rate_key in array array['global','ip:'||p_ip_hash,'email:'||p_email_hash] loop
    insert into public.purchase_recovery_limits(key,started_at,last_at,requests)
      values(rate_key,now(),now(),1)
      on conflict(key) do update set last_at=now(),
        started_at=case when purchase_recovery_limits.started_at<=now()-interval '1 hour' then now() else purchase_recovery_limits.started_at end,
        requests=case when purchase_recovery_limits.started_at<=now()-interval '1 hour' then 1 else purchase_recovery_limits.requests+1 end;
  end loop;
  return query select o.id,a.token,o.checkout_email,o.is_test,
    array(select i.product_title from public.order_items i where i.order_id=o.id order by i.id)
    from public.orders o join public.order_access a on a.order_id=o.id
    where lower(o.checkout_email)=p_email and o.status='paid' and a.revoked_at is null
      and public.test_order_allowed(o.id)
    order by o.created_at desc limit 50;
end $$;
revoke all on function public.request_purchase_recovery(text,text,text) from public,anon,authenticated;
grant execute on function public.request_purchase_recovery(text,text,text) to service_role;
create index orders_recovery_email_idx on public.orders(lower(checkout_email)) where status='paid';
commit;
