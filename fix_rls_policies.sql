-- ===============================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ АДМИН-ПАНЕЛИ
-- ===============================================

-- Удаляем старую политику (ограниченную только активными)
DROP POLICY IF EXISTS "Публичный доступ к товарам" ON products;

-- Создаем новую политику: читать ВСЕ товары (для админки)
CREATE POLICY "Публичный доступ к товарам" ON products
    FOR SELECT USING (true);

-- Разрешаем добавление товаров (для админки)
CREATE POLICY "Разрешить добавление товаров" ON products
    FOR INSERT WITH CHECK (true);

-- Разрешаем обновление товаров (для админки)
CREATE POLICY "Разрешить обновление товаров" ON products
    FOR UPDATE USING (true) WITH CHECK (true);

-- Разрешаем удаление товаров (для админки)
CREATE POLICY "Разрешить удаление товаров" ON products
    FOR DELETE USING (true);

-- Аналогично для категорий - читать все
DROP POLICY IF EXISTS "Публичный доступ к категориям" ON categories;
CREATE POLICY "Публичный доступ к категориям" ON categories
    FOR SELECT USING (true);

-- Разрешаем все операции для категорий
DROP POLICY IF EXISTS "Разрешить все операции с категориями" ON categories;
CREATE POLICY "Разрешить все операции с категориями" ON categories
    FOR ALL USING (true);

-- Для баннеров - читать все активные
DROP POLICY IF EXISTS "Публичный доступ к баннерам" ON promo_blocks;
CREATE POLICY "Публичный доступ к баннерам" ON promo_blocks
    FOR SELECT USING (true);

-- Разрешаем все операции для баннеров
DROP POLICY IF EXISTS "Разрешить все операции с баннерами" ON promo_blocks;
CREATE POLICY "Разрешить все операции с баннерами" ON promo_blocks
    FOR ALL USING (true);

-- ===============================================
-- ВАЖНО: Для production добавьте защиту!
-- ===============================================

-- Пример защищенной политики для будущего:
-- CREATE POLICY "Только админы редактируют товары" ON products
--     FOR ALL USING (auth.jwt()->>'role' = 'admin');

