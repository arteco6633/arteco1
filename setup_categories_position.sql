-- Добавляем поле позиции для ручной сортировки категорий
alter table if exists public.categories
  add column if not exists position integer;

-- Инициализируем позиции, если пусто: по алфавиту
update public.categories c
set position = sub.rn
from (
  select id, row_number() over (order by name asc, id asc) as rn
  from public.categories
) sub
where c.id = sub.id and c.position is null;

-- Индекс для сортировки
create index if not exists idx_categories_position on public.categories(position);

