-- Создание таблицы для партнеров
create table if not exists public.partners (
  id bigserial primary key,
  phone text not null unique,
  password_hash text not null,
  name text,
  email text,
  company_name text,
  partner_type text, -- 'architect' | 'designer' | 'manufacturer' | 'realtor' | 'developer' | 'foreman'
  commission_rate numeric(5,2) default 10.00, -- процент комиссии
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для быстрого поиска
create index if not exists partners_phone_idx on public.partners(phone);
create index if not exists partners_partner_type_idx on public.partners(partner_type);
create index if not exists partners_is_active_idx on public.partners(is_active);

-- Таблица для связи партнеров с заказами
create table if not exists public.partner_orders (
  id bigserial primary key,
  partner_id bigint not null references public.partners(id) on delete cascade,
  order_id bigint not null references public.orders(id) on delete cascade,
  client_name text,
  client_phone text,
  total_amount numeric(10,2) not null,
  commission_amount numeric(10,2) not null,
  status text default 'pending', -- 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(partner_id, order_id)
);

-- Индексы для быстрого поиска
create index if not exists partner_orders_partner_id_idx on public.partner_orders(partner_id);
create index if not exists partner_orders_order_id_idx on public.partner_orders(order_id);
create index if not exists partner_orders_status_idx on public.partner_orders(status);
create index if not exists partner_orders_created_at_idx on public.partner_orders(created_at desc);

-- Таблица для выплат комиссий партнерам
create table if not exists public.partner_commissions (
  id bigserial primary key,
  partner_id bigint not null references public.partners(id) on delete cascade,
  partner_order_id bigint not null references public.partner_orders(id) on delete cascade,
  amount numeric(10,2) not null,
  status text default 'pending', -- 'pending' | 'paid' | 'cancelled'
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для быстрого поиска
create index if not exists partner_commissions_partner_id_idx on public.partner_commissions(partner_id);
create index if not exists partner_commissions_status_idx on public.partner_commissions(status);
create index if not exists partner_commissions_paid_at_idx on public.partner_commissions(paid_at desc);

-- RLS политики
alter table public.partners enable row level security;
alter table public.partner_orders enable row level security;
alter table public.partner_commissions enable row level security;

-- Удаляем старые политики если они есть
drop policy if exists "Allow read own partner data" on public.partners;
drop policy if exists "Allow insert for anon" on public.partners;
drop policy if exists "Allow update own partner data" on public.partners;

drop policy if exists "Allow read own partner orders" on public.partner_orders;
drop policy if exists "Allow insert for anon" on public.partner_orders;
drop policy if exists "Allow update for anon" on public.partner_orders;

drop policy if exists "Allow read own commissions" on public.partner_commissions;
drop policy if exists "Allow insert for anon" on public.partner_commissions;
drop policy if exists "Allow update for anon" on public.partner_commissions;

-- Политики для партнеров
-- Разрешить чтение своих данных партнерам
-- Партнеры авторизуются через sessionStorage, а не через Supabase Auth,
-- поэтому они считаются 'anon' пользователями
create policy "Allow read own partner data" on public.partners
  for select
  to anon, authenticated
  using (true); -- Пока разрешаем всем, потом можно будет фильтровать по user_id

-- Разрешить вставку новых партнеров
create policy "Allow insert for anon" on public.partners
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить обновление своих данных
create policy "Allow update own partner data" on public.partners
  for update
  to authenticated
  using (true)
  with check (true);

-- Политики для заказов партнеров
-- Разрешить чтение своих заказов
-- Партнеры авторизуются через sessionStorage, а не через Supabase Auth,
-- поэтому они считаются 'anon' пользователями
create policy "Allow read own partner orders" on public.partner_orders
  for select
  to anon, authenticated
  using (true); -- Пока разрешаем всем, потом фильтровать по partner_id

-- Разрешить вставку заказов партнеров
create policy "Allow insert for anon" on public.partner_orders
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить обновление заказов партнеров
create policy "Allow update for anon" on public.partner_orders
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Политики для комиссий партнеров
-- Разрешить чтение своих комиссий
-- Партнеры авторизуются через sessionStorage, а не через Supabase Auth,
-- поэтому они считаются 'anon' пользователями
create policy "Allow read own commissions" on public.partner_commissions
  for select
  to anon, authenticated
  using (true); -- Пока разрешаем всем, потом фильтровать по partner_id

-- Разрешить вставку комиссий
create policy "Allow insert for anon" on public.partner_commissions
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить обновление комиссий
create policy "Allow update for anon" on public.partner_commissions
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Таблица для клиентов партнеров
create table if not exists public.partner_clients (
  id bigserial primary key,
  partner_id bigint not null references public.partners(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для быстрого поиска
create index if not exists partner_clients_partner_id_idx on public.partner_clients(partner_id);
create index if not exists partner_clients_phone_idx on public.partner_clients(phone);
create index if not exists partner_clients_created_at_idx on public.partner_clients(created_at desc);

-- RLS политики для клиентов партнеров
alter table public.partner_clients enable row level security;

-- Удаляем старые политики если они есть
drop policy if exists "Allow read own clients" on public.partner_clients;
drop policy if exists "Allow insert for anon" on public.partner_clients;
drop policy if exists "Allow update own clients" on public.partner_clients;
drop policy if exists "Allow delete own clients" on public.partner_clients;

-- Политики для клиентов партнеров
-- Разрешить чтение своих клиентов
-- Партнеры авторизуются через sessionStorage, а не через Supabase Auth,
-- поэтому они считаются 'anon' пользователями
create policy "Allow read own clients" on public.partner_clients
  for select
  to anon, authenticated
  using (true); -- Пока разрешаем всем, потом фильтровать по partner_id

-- Разрешить вставку клиентов
create policy "Allow insert for anon" on public.partner_clients
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить обновление своих клиентов
create policy "Allow update own clients" on public.partner_clients
  for update
  to authenticated
  using (true)
  with check (true);

-- Разрешить удаление своих клиентов
create policy "Allow delete own clients" on public.partner_clients
  for delete
  to authenticated
  using (true);

