-- Проверка всех политик для бакета banners
-- Выполните этот SQL в Supabase SQL Editor

SELECT 
    policyname,
    cmd,
    qual,
    CASE cmd
        WHEN 'SELECT' THEN '✅ Чтение'
        WHEN 'INSERT' THEN '✅ Загрузка'
        WHEN 'UPDATE' THEN '✅ Обновление'
        WHEN 'DELETE' THEN '✅ Удаление'
        ELSE cmd
    END as description
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE '%баннеров%'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
    END;

-- Должно быть 4 политики:
-- 1. SELECT - Публичное чтение изображений баннеров
-- 2. INSERT - Загрузка изображений баннеров
-- 3. UPDATE - Обновление изображений баннеров
-- 4. DELETE - Удаление изображений баннеров
