# Исправление ошибки CORS/400 на Beget Supabase

Если после настройки переменных окружения ошибка 400 сохраняется, выполните на Beget Supabase:

## 1. Отключить RLS для чтения или добавить разрешающие политики

Выполните этот SQL в Supabase SQL Editor:

```sql
-- Сделать таблицы доступными для чтения без авторизации
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks DISABLE ROW LEVEL SECURITY;

-- Или создать разрешающие политики:
CREATE POLICY "Allow public read access on products" ON products
FOR SELECT USING (true);

CREATE POLICY "Allow public read access on categories" ON categories
FOR SELECT USING (true);

CREATE POLICY "Allow public read access on promo_blocks" ON promo_blocks
FOR SELECT USING (true);
```

## 2. Проверить CORS настройки на Beget

В настройках Supabase на Beget убедитесь, что CORS разрешен для:
- `https://arteco1.vercel.app`
- `https://*.vercel.app`

## 3. Проверить URL в конфигурации

Убедитесь, что URL Supabase правильный:
- Должен быть: `https://zijajicude.beget.app`
- В конце НЕ должно быть слэша `/`

