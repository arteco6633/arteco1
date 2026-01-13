-- OTP коды для входа по телефону (NextAuth Credentials)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone on public.otp_codes(phone);

-- Простая таблица локальных пользователей
create table if not exists public.users_local (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.otp_codes enable row level security;
alter table public.users_local enable row level security;

-- Политики для OTP кодов
DROP POLICY IF EXISTS "otp read" ON public.otp_codes;
CREATE POLICY "otp read" ON public.otp_codes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "otp insert" ON public.otp_codes;
CREATE POLICY "otp insert" ON public.otp_codes
    FOR INSERT WITH CHECK (true);

-- Политики для локальных пользователей
DROP POLICY IF EXISTS "users_local read" ON public.users_local;
CREATE POLICY "users_local read" ON public.users_local
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_local insert" ON public.users_local;
CREATE POLICY "users_local insert" ON public.users_local
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_local update" ON public.users_local;
CREATE POLICY "users_local update" ON public.users_local
    FOR UPDATE USING (true) WITH CHECK (true);


