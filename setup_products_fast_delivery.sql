-- Добавление поля is_fast_delivery в таблицу products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_fast_delivery BOOLEAN DEFAULT false;

-- Комментарий к полю
COMMENT ON COLUMN products.is_fast_delivery IS 'Товар доступен для быстрой доставки';

