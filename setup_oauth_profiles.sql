-- Таблица для хранения внешних OAuth профилей (например, Яндекс ID)
create table if not exists public.oauth_profiles (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_user_id text not null,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

alter table public.oauth_profiles enable row level security;

-- Политики для OAuth профилей
DROP POLICY IF EXISTS "oauth_profiles_read" ON public.oauth_profiles;
CREATE POLICY "oauth_profiles_read" ON public.oauth_profiles
    FOR SELECT USING (true);


