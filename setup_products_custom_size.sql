-- Добавляет признак товаров "Под любые размеры"
alter table if exists public.products
  add column if not exists is_custom_size boolean not null default false;

-- Индекс для фильтрации
create index if not exists idx_products_is_custom_size on public.products(is_custom_size);


