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

-- Helper RPC to bypass schema cache issues and insert safely
create or replace function public.create_order(payload jsonb)
returns table(id bigint) as $$
declare
  v_id bigint;
begin
  insert into public.orders (
    user_id,
    contact,
    items,
    total,
    delivery,
    payment,
    status
  ) values (
    (payload->>'user_id')::uuid,
    coalesce(payload->'contact', '{}'::jsonb),
    coalesce(payload->'items', '[]'::jsonb),
    coalesce((payload->>'total')::numeric, 0),
    coalesce(payload->'delivery', '{}'::jsonb),
    coalesce(payload->'payment', '{}'::jsonb),
    'new'
  ) returning orders.id into v_id;
  return query select v_id;
end;
$$ language plpgsql security definer;

grant execute on function public.create_order(jsonb) to anon, authenticated;


