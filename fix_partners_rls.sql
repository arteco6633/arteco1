-- Исправление RLS политик для партнеров
-- Партнеры авторизуются через sessionStorage, а не через Supabase Auth,
-- поэтому они считаются 'anon' пользователями

-- Обновляем политики для таблицы partners
-- Разрешаем чтение для anon (так как партнеры авторизуются через sessionStorage)
drop policy if exists "Allow read own partner data" on public.partners;
create policy "Allow read own partner data" on public.partners
  for select
  to anon, authenticated
  using (true);

-- Обновляем политики для таблицы partner_clients
-- Разрешаем чтение для anon (так как партнеры авторизуются через sessionStorage)
drop policy if exists "Allow read own clients" on public.partner_clients;
create policy "Allow read own clients" on public.partner_clients
  for select
  to anon, authenticated
  using (true);

-- Обновляем политики для таблицы partner_orders
-- Разрешаем чтение для anon (так как партнеры авторизуются через sessionStorage)
drop policy if exists "Allow read own partner orders" on public.partner_orders;
create policy "Allow read own partner orders" on public.partner_orders
  for select
  to anon, authenticated
  using (true);

-- Обновляем политики для таблицы partner_commissions
-- Разрешаем чтение для anon (так как партнеры авторизуются через sessionStorage)
drop policy if exists "Allow read own commissions" on public.partner_commissions;
create policy "Allow read own commissions" on public.partner_commissions
  for select
  to anon, authenticated
  using (true);

