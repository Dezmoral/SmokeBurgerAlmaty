create table if not exists public.menu_items (
  id text primary key,
  product jsonb not null,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title_ru text not null check (char_length(title_ru) between 3 and 100),
  title_kk text not null check (char_length(title_kk) between 3 and 100),
  description_ru text not null check (char_length(description_ru) between 5 and 280),
  description_kk text not null check (char_length(description_kk) between 5 and 280),
  terms_ru text not null check (char_length(terms_ru) between 5 and 500),
  terms_kk text not null check (char_length(terms_kk) between 5 and 500),
  valid_from date,
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (valid_from is null or valid_until is null or valid_until >= valid_from)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(author) between 2 and 60),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.reviews enable row level security;
alter table public.staff_users enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to anon, authenticated;

grant select on public.menu_items, public.promotions, public.reviews to anon, authenticated;
grant insert, update, delete on public.menu_items, public.promotions to authenticated;
grant insert on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;

create policy "Menu is public to read" on public.menu_items
  for select to anon, authenticated using (true);
create policy "Staff manages menu" on public.menu_items
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Active promotions are public; staff can read all" on public.promotions
  for select to anon, authenticated using (
    (active and (valid_from is null or valid_from <= current_date) and (valid_until is null or valid_until >= current_date))
    or (select public.is_staff())
  );
create policy "Staff manages promotions" on public.promotions
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Published reviews are public; staff can read all" on public.reviews
  for select to anon, authenticated using (status = 'approved' or (select public.is_staff()));
create policy "Visitors submit pending reviews" on public.reviews
  for insert to anon, authenticated with check (status = 'pending');
create policy "Staff moderates reviews" on public.reviews
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff removes reviews" on public.reviews
  for delete to authenticated using ((select public.is_staff()));
