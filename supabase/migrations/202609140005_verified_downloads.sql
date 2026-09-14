begin;
create table public.download_browser_sessions (
  order_id uuid not null references public.orders(id),
  secret_hash text not null check (secret_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  primary key(order_id, secret_hash)
);
create table public.download_email_codes (
  order_id uuid primary key references public.orders(id),
  challenge_id uuid not null,
  code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
  browser_hash text not null check (browser_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed boolean not null default false,
  last_sent_at timestamptz not null,
  window_started_at timestamptz not null,
  send_count integer not null
);
alter table public.download_browser_sessions enable row level security;
alter table public.download_email_codes enable row level security;
revoke all on public.download_browser_sessions,public.download_email_codes from public,anon,authenticated;
grant all on public.download_browser_sessions,public.download_email_codes to service_role;

create function public.request_download_code(p_order uuid,p_challenge uuid,p_code_hash text,p_browser_hash text)
returns boolean language plpgsql set search_path='' as $$
declare previous public.download_email_codes;
begin
  if p_order is null or p_challenge is null or p_code_hash is null or p_browser_hash is null
    or p_code_hash !~ '^[a-f0-9]{64}$' or p_browser_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  perform 1 from public.orders where id=p_order and status='paid' and checkout_email is not null for update;
  if not found or not exists(select 1 from public.order_access where order_id=p_order and revoked_at is null) then return false; end if;
  select * into previous from public.download_email_codes where order_id=p_order;
  if previous.last_sent_at>now()-interval '60 seconds'
    or (previous.window_started_at>now()-interval '1 hour' and previous.send_count>=5) then return false; end if;
  insert into public.download_email_codes(order_id,challenge_id,code_hash,browser_hash,expires_at,last_sent_at,window_started_at,send_count)
    values(p_order,p_challenge,p_code_hash,p_browser_hash,now()+interval '10 minutes',now(),now(),1)
    on conflict(order_id) do update set challenge_id=p_challenge,code_hash=p_code_hash,browser_hash=p_browser_hash,
      expires_at=now()+interval '10 minutes',attempts=0,consumed=false,last_sent_at=now(),
      window_started_at=case when previous.window_started_at<=now()-interval '1 hour' then now() else previous.window_started_at end,
      send_count=case when previous.window_started_at<=now()-interval '1 hour' then 1 else previous.send_count+1 end;
  return true;
end $$;

create function public.verify_download_code(p_order uuid,p_code_hash text,p_browser_hash text)
returns boolean language plpgsql set search_path='' as $$
declare challenge public.download_email_codes;
begin
  perform 1 from public.orders where id=p_order and status='paid' for update;
  if not found or not exists(select 1 from public.order_access where order_id=p_order and revoked_at is null) then return false; end if;
  select * into challenge from public.download_email_codes where order_id=p_order for update;
  if challenge.order_id is null or challenge.consumed or challenge.expires_at<=now() or challenge.attempts>=5
    or challenge.browser_hash is distinct from p_browser_hash then return false; end if;
  update public.download_email_codes set attempts=attempts+1 where order_id=p_order;
  if challenge.code_hash is distinct from p_code_hash then return false; end if;
  update public.download_email_codes set consumed=true where order_id=p_order;
  insert into public.download_browser_sessions(order_id,secret_hash,expires_at)
    values(p_order,p_browser_hash,now()+interval '7 days') on conflict(order_id,secret_hash)
    do update set expires_at=excluded.expires_at;
  return true;
end $$;
revoke all on function public.request_download_code(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.verify_download_code(uuid,text,text) from public,anon,authenticated;
grant execute on function public.request_download_code(uuid,uuid,text,text) to service_role;
grant execute on function public.verify_download_code(uuid,text,text) to service_role;
commit;
