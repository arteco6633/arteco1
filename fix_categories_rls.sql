-- Исправление RLS политик для таблицы categories
-- Выполните этот SQL скрипт в Supabase SQL Editor на Beget

-- Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Публичный доступ к категориям" ON categories;
DROP POLICY IF EXISTS "Разрешить все операции с категориями" ON categories;
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;

-- Разрешаем чтение категорий (SELECT)
CREATE POLICY "Публичный доступ к категориям" ON categories
    FOR SELECT USING (true);

-- Разрешаем добавление категорий (INSERT)
CREATE POLICY "Разрешить добавление категорий" ON categories
    FOR INSERT WITH CHECK (true);

-- Разрешаем обновление категорий (UPDATE)
CREATE POLICY "Разрешить обновление категорий" ON categories
    FOR UPDATE USING (true) WITH CHECK (true);

-- Разрешаем удаление категорий (DELETE)
CREATE POLICY "Разрешить удаление категорий" ON categories
    FOR DELETE USING (true);

-- Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'categories';

