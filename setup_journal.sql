-- Создание таблицы для статей журнала
create table if not exists public.journal_articles (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null, -- markdown контент
  featured_image text,
  og_image text,
  author_name text,
  author_avatar text,
  category text,
  tags text[], -- массив тегов
  related_products bigint[], -- массив ID связанных товаров для секции "Вам может понравится"
  views_count integer default 0,
  is_published boolean default false,
  is_featured boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Индексы для быстрого поиска
create index if not exists journal_articles_slug_idx on public.journal_articles(slug);
create index if not exists journal_articles_published_idx on public.journal_articles(is_published, published_at desc);
create index if not exists journal_articles_featured_idx on public.journal_articles(is_featured, published_at desc);
create index if not exists journal_articles_category_idx on public.journal_articles(category);
create index if not exists journal_articles_tags_idx on public.journal_articles using gin(tags);

-- RLS политики
alter table public.journal_articles enable row level security;

-- Удаляем старые политики если они есть (безопасно для повторного выполнения)
drop policy if exists "Allow read published articles" on public.journal_articles;
drop policy if exists "Allow read all articles" on public.journal_articles;
drop policy if exists "Allow insert for anon" on public.journal_articles;
drop policy if exists "Allow update for anon" on public.journal_articles;
drop policy if exists "Allow delete for anon" on public.journal_articles;

-- Разрешить чтение всех статей (включая неопубликованные) - для админ панели и публичного доступа
-- На клиенте мы сами фильтруем по is_published
create policy "Allow read all articles" on public.journal_articles
  for select
  to anon, authenticated
  using (true);

-- Разрешить вставку статей (для админ панели)
create policy "Allow insert for anon" on public.journal_articles
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить обновление статей (для админ панели)
create policy "Allow update for anon" on public.journal_articles
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Разрешить удаление статей (для админ панели)
create policy "Allow delete for anon" on public.journal_articles
  for delete
  to anon, authenticated
  using (true);

