alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','not_required','processing','pending','paid','failed')),
  add column if not exists payment_provider text,
  add column if not exists provider_payment_id text,
  add column if not exists payment_url text;

create unique index if not exists orders_provider_payment_id_uidx
  on public.orders (provider_payment_id)
  where provider_payment_id is not null;

create index if not exists orders_payment_status_created_at_idx
  on public.orders (payment_status, created_at desc);

drop policy if exists "Visitors create new orders with consent" on public.orders;
create policy "Visitors create unpaid orders with consent" on public.orders
  for insert to anon, authenticated
  with check (
    status = 'new'
    and consent is true
    and payment_status in ('unpaid','not_required')
    and payment_provider is null
    and provider_payment_id is null
    and payment_url is null
  );
