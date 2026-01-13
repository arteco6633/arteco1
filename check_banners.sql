-- Проверка баннеров в базе данных
-- Выполните этот SQL запрос в Supabase SQL Editor

-- 1. Проверка всех баннеров
SELECT 
    id,
    title,
    position,
    is_active,
    sort_order,
    image_url,
    link_url,
    created_at
FROM promo_blocks
ORDER BY sort_order;

-- 2. Проверка активных баннеров
SELECT 
    id,
    title,
    position,
    is_active,
    sort_order,
    CASE 
        WHEN is_active = true THEN '✅ Активен'
        WHEN is_active = false THEN '❌ Неактивен'
        ELSE '❓ NULL'
    END as status
FROM promo_blocks
ORDER BY sort_order;

-- 3. Проверка типа данных is_active
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'promo_blocks'
    AND column_name = 'is_active';

-- 4. Проверка RLS политик для promo_blocks
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'promo_blocks';
