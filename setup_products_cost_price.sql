-- Добавление поля себестоимости (цена поставщика) в таблицу products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT NULL;

-- Комментарий к полю
COMMENT ON COLUMN products.cost_price IS 'Себестоимость товара (цена поставщика Woodville)';

