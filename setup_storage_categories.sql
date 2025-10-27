-- Настройка политик для бакета categories
-- Выполните этот SQL в Supabase SQL Editor на Beget

-- Убедимся, что бакет существует и публичный
UPDATE storage.buckets 
SET public = true 
WHERE id = 'categories';

-- Устанавливаем политики для публичного чтения изображений категорий
DROP POLICY IF EXISTS "Публичное чтение изображений категорий" ON storage.objects;
CREATE POLICY "Публичное чтение изображений категорий"
ON storage.objects
FOR SELECT
USING (bucket_id = 'categories');

-- Позволяем загружать изображения категорий
DROP POLICY IF EXISTS "Загрузка изображений категорий" ON storage.objects;
CREATE POLICY "Загрузка изображений категорий"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'categories');

-- Позволяем обновлять изображения категорий
DROP POLICY IF EXISTS "Обновление изображений категорий" ON storage.objects;
CREATE POLICY "Обновление изображений категорий"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'categories');

-- Позволяем удалять изображения категорий
DROP POLICY IF EXISTS "Удаление изображений категорий" ON storage.objects;
CREATE POLICY "Удаление изображений категорий"
ON storage.objects
FOR DELETE
USING (bucket_id = 'categories');

-- Проверяем политики storage
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%категорий%';

