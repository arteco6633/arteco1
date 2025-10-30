-- Таблица для записей игр/promotions
create table if not exists public.game_plays (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  phone text,
  prize text not null,
  meta jsonb
);

-- Разрешить анонимное чтение/запись (как и для квиза)
alter table public.game_plays enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'game_plays' and policyname = 'game_plays_select'
  ) then
    create policy game_plays_select on public.game_plays for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'game_plays' and policyname = 'game_plays_insert'
  ) then
    create policy game_plays_insert on public.game_plays for insert to anon with check (true);
  end if;
end $$;

-- Призы, закреплённые за пользователем (по номеру телефона)
create table if not exists public.user_prizes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  phone text not null,
  prize text not null,
  source text
);

alter table public.user_prizes enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_prizes' and policyname = 'user_prizes_select'
  ) then
    create policy user_prizes_select on public.user_prizes for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_prizes' and policyname = 'user_prizes_insert'
  ) then
    create policy user_prizes_insert on public.user_prizes for insert to anon with check (true);
  end if;
end $$;


