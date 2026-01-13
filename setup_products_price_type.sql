-- Добавление полей price_type и price_per_m2 в таблицу products
-- Выполните этот SQL скрипт в Supabase SQL Editor

-- Добавляем колонку price_type (тип цены: 'fixed' - за всё, 'per_m2' - за м²)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_type VARCHAR(10) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_m2'));

-- Добавляем колонку price_per_m2 (площадь в м² для расчета цены, если цена за м²)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_per_m2 NUMERIC(10, 2) NULL;

-- Комментарии к колонкам
COMMENT ON COLUMN products.price_type IS 'Тип цены: fixed - за всё, per_m2 - за м²';
COMMENT ON COLUMN products.price_per_m2 IS 'Площадь в м² для предпросмотра цены, если цена за м²';



