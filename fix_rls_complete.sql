-- Полное отключение RLS и удаление всех политик
-- Выполните этот скрипт в SQL Editor на Beget

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access on promo_blocks" ON promo_blocks;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON promo_blocks;

-- Полностью отключаем RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks DISABLE ROW LEVEL SECURITY;

-- Проверяем статус RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('products', 'categories', 'promo_blocks');

