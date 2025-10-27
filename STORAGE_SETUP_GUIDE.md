# Настройка Supabase Storage для загрузки изображений

## Проблема
Ошибка: `StorageApiError: Bucket not found`

## Решение

### 1. Откройте Supabase Dashboard
Перейдите в ваш Beget Supabase: https://zijajicude.beget.app

### 2. Откройте SQL Editor
Найдите в меню раздел **SQL Editor**

### 3. Выполните SQL скрипт
Скопируйте и выполните следующий код:

```sql
-- Создание бакета для изображений товаров
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('product', 'product', true, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Политики для публичного чтения
CREATE POLICY "Публичное чтение изображений"
ON storage.objects FOR SELECT
USING (bucket_id = 'product');

-- Политика для загрузки (доступно всем)
CREATE POLICY "Публичная загрузка изображений"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product');

-- Политика для обновления
CREATE POLICY "Публичное обновление изображений"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product')
WITH CHECK (bucket_id = 'product');

-- Политика для удаления
CREATE POLICY "Публичное удаление изображений"
ON storage.objects FOR DELETE
USING (bucket_id = 'product');
```

### 4. Альтернативный способ (через веб-интерфейс)
Если SQL Editor недоступен:

1. Перейдите в раздел **Storage**
2. Нажмите **New Bucket**
3. Название: `product`
4. Включите **Public bucket**
5. Сохраните

### 5. Проверка
Обновите страницу http://localhost:3000/admin/products и попробуйте загрузить изображение.

## После выполнения
Ошибка "Bucket not found" должна исчезнуть, и загрузка изображений будет работать корректно.

