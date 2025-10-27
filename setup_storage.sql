-- ===============================================
-- НАСТРОЙКА SUPABASE STORAGE ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ
-- ===============================================

-- Создаем bucket для товаров
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Политика: Все могут читать изображения
CREATE POLICY "Публичный доступ к изображениям товаров" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

-- Политика: Разрешить загрузку изображений (для админ-панели)
CREATE POLICY "Разрешить загрузку изображений товаров" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'products');

-- Политика: Разрешить обновление изображений
CREATE POLICY "Разрешить обновление изображений товаров" ON storage.objects
    FOR UPDATE USING (bucket_id = 'products');

-- Политика: Разрешить удаление изображений
CREATE POLICY "Разрешить удаление изображений товаров" ON storage.objects
    FOR DELETE USING (bucket_id = 'products');

-- Проверка результата
SELECT * FROM storage.buckets WHERE name = 'products';

