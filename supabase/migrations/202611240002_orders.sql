create table if not exists public.orders (
  id uuid primary key,
  order_code text not null unique check (order_code ~ '^SB-[A-Z0-9]{8}$'),
  customer_name text not null check (char_length(customer_name) between 2 and 60),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  delivery_address text not null check (char_length(delivery_address) between 5 and 300),
  customer_comment text not null default '' check (char_length(customer_comment) <= 500),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 40),
  total integer not null check (total > 0),
  consent boolean not null check (consent is true),
  consented_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','accepted','preparing','ready','delivered','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

create policy "Visitors create new orders with consent" on public.orders
  for insert to anon, authenticated with check (status = 'new' and consent is true);
create policy "Staff reads all orders" on public.orders
  for select to authenticated using ((select public.is_staff()));
create policy "Staff updates orders" on public.orders
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff deletes orders" on public.orders
  for delete to authenticated using ((select public.is_staff()));

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
