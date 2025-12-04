-- Добавление колонки model_3d_url в таблицу products
-- Выполните этот SQL скрипт в Supabase SQL Editor

-- Добавляем колонку model_3d_url (URL 3D модели в формате OBJ)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS model_3d_url TEXT NULL;

-- Комментарий к колонке
COMMENT ON COLUMN products.model_3d_url IS 'URL 3D модели товара в формате OBJ для интерактивного просмотра';


