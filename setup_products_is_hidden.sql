-- Добавление поля is_hidden для скрытия товаров в каталоге
-- Скрытые товары не отображаются в каталоге, но доступны при переходе по цвету

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Комментарий к полю
COMMENT ON COLUMN products.is_hidden IS 'Скрыть товар в каталоге (товар будет доступен только при переходе по цвету из другого товара)';

