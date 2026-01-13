-- Проверка ВСЕХ политик для storage.objects (чтобы найти SELECT политику)
-- Выполните этот SQL в Supabase SQL Editor

-- Проверяем все политики, связанные с бакетом banners
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (
        policyname LIKE '%баннеров%' 
        OR qual LIKE '%banners%'
        OR with_check LIKE '%banners%'
    )
ORDER BY cmd;

-- Также проверим все политики для storage.objects (без фильтра)
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
ORDER BY policyname;
