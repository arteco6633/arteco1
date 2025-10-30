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

create policy if not exists "otp read insert" on public.otp_codes for select using (true);
create policy if not exists "otp insert" on public.otp_codes for insert with check (true);

create policy if not exists "users_local read" on public.users_local for select using (true);
create policy if not exists "users_local upsert" on public.users_local for insert with check (true);


