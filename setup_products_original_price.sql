-- Добавляем поле для старой цены товара
alter table if exists public.products
  add column if not exists original_price numeric(10, 2);

-- Индекс не нужен, т.к. это поле не используется для фильтрации/сортировки

