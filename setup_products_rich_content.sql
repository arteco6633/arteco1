-- Добавление поля rich_content для хранения дополнительного контента под цветами
-- Формат: JSONB массив объектов с полями: title, description, image_url
-- Пример: [
--   {"title": "Впишется в любой интерьер", "description": "...", "image_url": "..."},
--   {"title": "Упакуем аккуратно", "description": "...", "image_url": "..."},
--   {"title": "Легкая сборка", "description": "...", "image_url": "..."}
-- ]

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT '[]'::jsonb;

-- Комментарий к полю
COMMENT ON COLUMN products.rich_content IS 'Дополнительный контент под цветами: массив объектов с title, description, image_url';

