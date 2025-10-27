-- Добавление колонки is_new в таблицу products
-- Выполните этот SQL скрипт в Supabase SQL Editor на Beget

-- Добавляем колонку is_new (если её нет)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Проверяем структуру таблицы products
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

