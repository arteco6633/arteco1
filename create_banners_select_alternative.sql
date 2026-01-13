-- Альтернативный способ создания политики SELECT для banners
-- Выполните этот SQL в Supabase SQL Editor

-- Пробуем создать политику с более простым именем
DROP POLICY IF EXISTS "banners_select_policy" ON storage.objects;
CREATE POLICY "banners_select_policy"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

-- Проверяем результат
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND (
        qual LIKE '%banners%'
        OR policyname LIKE '%banners%'
    )
ORDER BY cmd;
