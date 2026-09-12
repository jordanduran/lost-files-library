begin;

-- Supabase Auth owns identities, verified email addresses, and sessions.
-- Store prices in cents and audio in object storage, never in database rows.
create table public.products (
  id text primary key,
  slug text not null unique,
  title text not null,
  producer text not null,
  genre text not null,
  mood text[] not null default '{}',
  bpm integer not null check (bpm > 0),
  musical_key text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  artwork text not null,
  preview_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.product_licenses (
  product_id text not null references public.products(id),
  id text not null,
  name text not null,
  description text not null,
  includes text[] not null default '{}',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  primary key (product_id, id)
);
-- Private file references are accessible only to trusted server credentials.
create table public.product_files (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  license_id text not null,
  storage_provider text not null check (storage_provider in ('r2', 'supabase')),
  bucket text not null,
  object_key text not null,
  download_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  foreign key (product_id, license_id) references public.product_licenses(product_id, id),
  unique (product_id, license_id, storage_provider, bucket, object_key)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  checkout_session_id text unique,
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null)
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  product_id text not null,
  license_id text not null,
  -- Purchase snapshots preserve receipts when catalog copy changes.
  product_title text not null,
  license_name text not null,
  license_terms text not null,
  file_labels text[] not null default '{}',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  foreign key (product_id, license_id) references public.product_licenses(product_id, id),
  unique (order_id, product_id, license_id)
);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_license_idx on public.order_items(product_id, license_id);

alter table public.products enable row level security;
alter table public.product_licenses enable row level security;
alter table public.product_files enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.products, public.product_licenses, public.product_files, public.orders, public.order_items from anon, authenticated;
grant select on public.products, public.product_licenses to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
grant all on public.products, public.product_licenses, public.product_files, public.orders, public.order_items to service_role;
create policy "Published products are public" on public.products for select to anon, authenticated using (published);
create policy "Published licenses are public" on public.product_licenses for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.published));
create policy "Customers read their orders" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Customers read their order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
-- No client write policies: customers cannot create paid orders or alter prices.
commit;
