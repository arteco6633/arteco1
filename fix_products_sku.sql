-- Исправление поля sku в таблице products
-- Выполните этот SQL скрипт в Supabase SQL Editor на Beget

-- Делаем поле sku необязательным
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;

-- Проверяем структуру таблицы products
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

