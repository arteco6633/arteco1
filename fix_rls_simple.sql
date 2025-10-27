-- Простое решение: отключить RLS для публичного чтения
-- Выполните этот SQL в Supabase SQL Editor на Beget

-- Отключаем RLS полностью для публичного чтения
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks DISABLE ROW LEVEL SECURITY;

