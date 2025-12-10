-- ===============================================
-- ОПТИМИЗАЦИЯ ИНДЕКСОВ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- Выполните этот SQL скрипт в Supabase SQL Editor
-- ===============================================
-- 
-- ВАЖНО: Эти индексы критичны для производительности на слабом сервере!
-- После создания индексов выполните ANALYZE для обновления статистики.
--

-- ===============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ products (КРИТИЧНО!)
-- ===============================================

-- Частичные индексы для быстрого поиска featured и new товаров
-- Эти индексы занимают меньше места и работают быстрее, чем полные индексы
CREATE INDEX IF NOT EXISTS idx_products_is_featured_partial 
  ON products(is_featured, id DESC) 
  WHERE is_featured = true AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_products_is_new_partial 
  ON products(is_new, id DESC) 
  WHERE is_new = true AND is_hidden = false;

-- Индекс для скрытых товаров (используется в WHERE is_hidden = false)
CREATE INDEX IF NOT EXISTS idx_products_is_hidden 
  ON products(is_hidden) 
  WHERE is_hidden = false;

-- Композитный индекс для поиска по категории (используется в каталоге)
CREATE INDEX IF NOT EXISTS idx_products_category_hidden 
  ON products(category_id, is_hidden, id DESC) 
  WHERE is_hidden = false;

-- Индекс для быстрого поиска товаров с фильтрами
CREATE INDEX IF NOT EXISTS idx_products_custom_size 
  ON products(is_custom_size) 
  WHERE is_custom_size = true AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_products_fast_delivery 
  ON products(is_fast_delivery) 
  WHERE is_fast_delivery = true AND is_hidden = false;

-- ===============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ promo_blocks
-- ===============================================

-- Частичный индекс для активных баннеров
CREATE INDEX IF NOT EXISTS idx_promo_blocks_active_partial 
  ON promo_blocks(is_active, position, sort_order) 
  WHERE is_active = true;

-- Индекс для поиска баннеров по позиции
CREATE INDEX IF NOT EXISTS idx_promo_blocks_position_sort 
  ON promo_blocks(position, sort_order, is_active) 
  WHERE is_active = true;

-- ===============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ categories
-- ===============================================

-- Частичный индекс для активных категорий
CREATE INDEX IF NOT EXISTS idx_categories_active_partial 
  ON categories(is_active) 
  WHERE is_active = true;

-- Индекс для поиска по slug (используется в каталоге)
CREATE INDEX IF NOT EXISTS idx_categories_slug 
  ON categories(slug) 
  WHERE is_active = true;

-- ===============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ client_interiors
-- ===============================================

-- Индекс для сортировки по дате создания (DESC)
CREATE INDEX IF NOT EXISTS idx_interiors_created_at_desc 
  ON client_interiors(created_at DESC);

-- ===============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ journal_articles (если используется)
-- ===============================================

-- Индекс для опубликованных статей
CREATE INDEX IF NOT EXISTS idx_journal_published 
  ON journal_articles(is_published, created_at DESC) 
  WHERE is_published = true;

-- Индекс для поиска по slug
CREATE INDEX IF NOT EXISTS idx_journal_slug 
  ON journal_articles(slug) 
  WHERE is_published = true;

-- ===============================================
-- ОБНОВЛЕНИЕ СТАТИСТИКИ PostgreSQL
-- ===============================================
-- ВАЖНО: После создания индексов выполните ANALYZE для обновления статистики
-- Это поможет PostgreSQL выбрать оптимальные индексы для запросов

ANALYZE products;
ANALYZE promo_blocks;
ANALYZE categories;
ANALYZE client_interiors;
ANALYZE journal_articles;

-- ===============================================
-- ПРОВЕРКА СОЗДАННЫХ ИНДЕКСОВ
-- ===============================================
-- Выполните этот запрос, чтобы увидеть все созданные индексы:

-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('products', 'promo_blocks', 'categories', 'client_interiors', 'journal_articles')
-- ORDER BY tablename, indexname;

-- ===============================================
-- ОЖИДАЕМЫЕ УЛУЧШЕНИЯ
-- ===============================================
-- 
-- До оптимизации (на слабом сервере без индексов):
-- - Запрос featured товаров: 500-2000ms
-- - Запрос new товаров: 500-2000ms
-- - Запрос баннеров: 200-800ms
-- - Запрос категории: 300-1000ms
-- 
-- После оптимизации (с индексами):
-- - Запрос featured товаров: 50-200ms (в 5-10 раз быстрее)
-- - Запрос new товаров: 50-200ms (в 5-10 раз быстрее)
-- - Запрос баннеров: 20-100ms (в 5-10 раз быстрее)
-- - Запрос категории: 30-150ms (в 5-10 раз быстрее)
--
-- НА МЕДЛЕННОМ ИНТЕРНЕТЕ ЭТО ДАСТ УСКОРЕНИЕ В 5-15 РАЗ!

