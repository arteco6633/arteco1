-- Добавление политики SELECT для бакета banners
-- Выполните этот SQL в Supabase SQL Editor

-- Сначала удаляем, если существует (чтобы избежать ошибки)
DROP POLICY IF EXISTS "Публичное чтение изображений баннеров" ON storage.objects;

-- Создаем политику SELECT
CREATE POLICY "Публичное чтение изображений баннеров"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

-- Проверяем все политики
SELECT 
    policyname,
    cmd,
    qual
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
