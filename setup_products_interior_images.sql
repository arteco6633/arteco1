-- Добавляем поле для изображений интерьера
ALTER TABLE products
ADD COLUMN IF NOT EXISTS interior_images JSONB DEFAULT '[]'::jsonb;

-- Комментарий к полю
COMMENT ON COLUMN products.interior_images IS 'Массив URL изображений товара в интерьере';

