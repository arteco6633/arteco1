# Инструкция по настройке таблиц партнеров в Supabase

## Проблема
Если данные попадают в неправильные таблицы (например, партнеры в `product_modules`, клиенты в `partner_commissions`), это означает, что таблицы `partners` и `partner_clients` не были созданы в Supabase.

## Решение

### Шаг 1: Откройте Supabase SQL Editor
1. Войдите в ваш проект Supabase
2. Перейдите в раздел **SQL Editor** (левое меню)
3. Создайте новый запрос

### Шаг 2: Выполните SQL скрипт
1. Скопируйте весь содержимое файла `setup_partners.sql`
2. Вставьте его в SQL Editor
3. Нажмите **Run** (или Ctrl+Enter)

### Шаг 3: Проверьте создание таблиц
Выполните скрипт `check_partners_tables.sql` для проверки:

```sql
-- Проверяем существование таблицы partners
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partners'
) AS partners_exists;

-- Проверяем существование таблицы partner_clients
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partner_clients'
) AS partner_clients_exists;
```

Обе таблицы должны вернуть `true`.

### Шаг 4: Проверьте структуру таблиц
Убедитесь, что таблицы имеют правильную структуру:

**Таблица `partners` должна содержать:**
- `id` (bigserial)
- `phone` (text)
- `password_hash` (text)
- `name` (text)
- `email` (text)
- `company_name` (text)
- `partner_type` (text)
- `commission_rate` (numeric)
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Таблица `partner_clients` должна содержать:**
- `id` (bigserial)
- `partner_id` (bigint)
- `name` (text)
- `phone` (text)
- `email` (text)
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Шаг 5: Очистите неправильные данные
Если данные уже попали в неправильные таблицы, удалите их:

```sql
-- Удаляем неправильные данные из product_modules (если они там)
DELETE FROM product_modules WHERE phone IS NOT NULL;

-- Удаляем неправильные данные из partner_commissions (если они там)
DELETE FROM partner_commissions WHERE name IS NOT NULL AND phone IS NOT NULL;
```

### Шаг 6: Повторите регистрацию
После создания таблиц повторите регистрацию партнера и добавление клиента.

## Важно
- Убедитесь, что вы используете правильный проект Supabase
- Проверьте, что `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в `.env` соответствуют вашему проекту
- После выполнения скрипта перезапустите Next.js сервер (`npm run dev`)

