-- ===============================================
-- НАСТРОЙКА STORAGE ДЛЯ БАННЕРОВ
-- ===============================================
-- Выполните этот SQL в Supabase SQL Editor

-- Создаем бакет banners (если его еще нет)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Публичное чтение изображений баннеров" ON storage.objects;
DROP POLICY IF EXISTS "Загрузка изображений баннеров" ON storage.objects;
DROP POLICY IF EXISTS "Обновление изображений баннеров" ON storage.objects;
DROP POLICY IF EXISTS "Удаление изображений баннеров" ON storage.objects;

-- Политика: Все могут читать изображения баннеров
CREATE POLICY "Публичное чтение изображений баннеров"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

-- Политика: Разрешить загрузку изображений баннеров
CREATE POLICY "Загрузка изображений баннеров"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners');

-- Политика: Разрешить обновление изображений баннеров
CREATE POLICY "Обновление изображений баннеров"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners')
WITH CHECK (bucket_id = 'banners');

-- Политика: Разрешить удаление изображений баннеров
CREATE POLICY "Удаление изображений баннеров"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banners');

-- Проверка результата
SELECT id, name, public FROM storage.buckets WHERE id = 'banners';

-- Проверка политик
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE '%баннеров%';
