-- Orders schema
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid null,
  contact jsonb not null,
  items jsonb not null,
  total numeric not null,
  delivery jsonb null,
  payment jsonb null,
  status text not null default 'new'
);

-- RLS
alter table public.orders enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Allow insert for anon'
  ) then
    create policy "Allow insert for anon" on public.orders for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Allow read own by anon'
  ) then
    create policy "Allow read own by anon" on public.orders for select to anon using (true);
  end if;
end $$;


