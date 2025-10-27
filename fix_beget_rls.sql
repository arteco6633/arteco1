-- Исправление RLS политик для работы с Vercel

-- Для таблицы products
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
CREATE POLICY "Allow public read access on products" ON products
  FOR SELECT USING (true);

-- Для таблицы categories
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
CREATE POLICY "Allow public read access on categories" ON categories
  FOR SELECT USING (true);

-- Для таблицы promo_blocks
DROP POLICY IF EXISTS "Allow public read access on promo_blocks" ON promo_blocks;
CREATE POLICY "Allow public read access on promo_blocks" ON promo_blocks
  FOR SELECT USING (true);

-- Убедитесь, что RLS включен, но с открытыми политиками
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks ENABLE ROW LEVEL SECURITY;

