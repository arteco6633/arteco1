-- Таблица модулей кухонь
create table if not exists public.product_modules (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  description text,
  image_url text,
  price numeric(12,2) not null default 0,
  width integer,
  height integer,
  depth integer,
  kind text, -- base / wall / tall / corner / other
  position integer, -- для сортировки
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists product_modules_product_id_idx on public.product_modules(product_id);
create index if not exists product_modules_kind_idx on public.product_modules(kind);

alter table public.product_modules enable row level security;

-- Политики RLS: открываем CRUD для anon/authenticated (как в остальных админ разделах)
drop policy if exists "pm_read" on public.product_modules;
drop policy if exists "pm_insert" on public.product_modules;
drop policy if exists "pm_update" on public.product_modules;
drop policy if exists "pm_delete" on public.product_modules;

create policy "pm_read" on public.product_modules for select to anon, authenticated using (true);
create policy "pm_insert" on public.product_modules for insert to anon, authenticated with check (true);
create policy "pm_update" on public.product_modules for update to anon, authenticated using (true) with check (true);
create policy "pm_delete" on public.product_modules for delete to anon, authenticated using (true);


