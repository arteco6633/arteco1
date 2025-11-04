-- Скрипт для проверки существования таблиц партнеров
-- Выполните этот скрипт в Supabase SQL Editor

-- Проверяем существование таблицы partners
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partners'
) AS partners_exists;

-- Проверяем существование таблицы partner_clients
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partner_clients'
) AS partner_clients_exists;

-- Проверяем структуру таблицы partners (если существует)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'partners'
ORDER BY ordinal_position;

-- Проверяем структуру таблицы partner_clients (если существует)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'partner_clients'
ORDER BY ordinal_position;

-- Проверяем, есть ли данные в таблице partners
SELECT COUNT(*) as partners_count FROM public.partners;

-- Проверяем, есть ли данные в таблице partner_clients
SELECT COUNT(*) as clients_count FROM public.partner_clients;

