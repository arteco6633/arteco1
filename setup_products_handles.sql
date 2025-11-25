-- Добавление колонки handles в таблицу products
-- Выполните этот SQL скрипт в Supabase SQL Editor

-- Добавляем колонку handles (JSONB массив объектов с полями: name, description, image_url, delta_price)
-- Формат аналогичен fillings, hinges, drawers, lighting
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS handles JSONB DEFAULT '[]'::jsonb;

-- Комментарий к колонке
COMMENT ON COLUMN products.handles IS 'Массив ручек с опциями (name, description, image_url, delta_price)';

