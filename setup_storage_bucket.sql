-- Создание бакета для изображений товаров
-- Выполните этот SQL в Supabase SQL Editor

-- Создаем бакет product
INSERT INTO storage.buckets (id, name, public)
VALUES ('product', 'product', true);

-- Устанавливаем политики для публичного чтения
CREATE POLICY "Публичное чтение изображений товаров"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product');

-- Позволяем загружать изображения (для авторизованных пользователей)
CREATE POLICY "Загрузка изображений товаров"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product');

-- Позволяем обновлять изображения
CREATE POLICY "Обновление изображений товаров"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product');

-- Позволяем удалять изображения
CREATE POLICY "Удаление изображений товаров"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product');

