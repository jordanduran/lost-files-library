begin;
create table public.purchase_emails (
  order_id uuid primary key references public.orders(id),
  recipient text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','review')),
  payload jsonb,
  first_attempt_at timestamptz,
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_id text,
  created_at timestamptz not null default now()
);
alter table public.purchase_emails enable row level security;
revoke all on public.purchase_emails from anon, authenticated;
grant all on public.purchase_emails to service_role;

create function public.queue_purchase_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    insert into public.purchase_emails(order_id, recipient)
      select new.id, email from auth.users where id = new.user_id and email is not null
      on conflict (order_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.queue_purchase_email() from public, anon, authenticated;
create trigger queue_purchase_email after update of status on public.orders
  for each row execute function public.queue_purchase_email();

-- A lease avoids simultaneous sends; the provider also receives a stable idempotency key.
-- Stop ambiguous retries before the provider's 24-hour deduplication window expires.
create function public.claim_purchase_email(p_order uuid) returns setof public.purchase_emails
language plpgsql set search_path = '' as $$
begin
  update public.purchase_emails set status = 'review'
    where order_id = p_order and status in ('pending','sending')
    and first_attempt_at < now() - interval '23 hours';
  return query update public.purchase_emails e
    set status = 'sending', claimed_at = now(), first_attempt_at = coalesce(first_attempt_at, now())
    where e.order_id = p_order and (e.status = 'pending' or (e.status = 'sending' and e.claimed_at < now() - interval '2 minutes'))
    and exists(select 1 from public.orders o where o.id = e.order_id and o.status = 'paid')
    returning e.*;
end $$;
revoke all on function public.claim_purchase_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_purchase_email(uuid) to service_role;
-- Previous purchases are deliberately not emailed retroactively.
commit;
