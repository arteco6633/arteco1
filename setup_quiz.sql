-- Таблица для заявок из квиза кухни
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text,
  dimensions jsonb,
  layout text,
  name text,
  phone text,
  meta jsonb
);

-- Включаем RLS (по желанию)
alter table public.quiz_responses enable row level security;

-- Политика для сервиса (service role имеет bypass RLS, но добавим безопасную политику на чтение при необходимости)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='quiz_responses' and policyname='Allow read for anon'
  ) then
    create policy "Allow read for anon" on public.quiz_responses for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='quiz_responses' and policyname='Allow insert for anon'
  ) then
    create policy "Allow insert for anon" on public.quiz_responses for insert to anon with check (true);
  end if;
end $$;


