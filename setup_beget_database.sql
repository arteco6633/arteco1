-- ===============================================
-- ПОЛНАЯ НАСТРОЙКА БД ДЛЯ ARTECO
-- Выполните этот скрипт целиком в SQL Editor
-- ===============================================

-- ===============================================
-- 1. СОЗДАНИЕ ТАБЛИЦ
-- ===============================================

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id) NULL,
    image_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    images TEXT[],
    is_featured BOOLEAN DEFAULT false,
    brand VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    attributes JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица промо-баннеров
CREATE TABLE IF NOT EXISTS promo_blocks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text VARCHAR(100),
    position VARCHAR(50) NOT NULL CHECK (position IN ('homepage', 'top', 'middle', 'bottom')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target VARCHAR(20) DEFAULT '_self',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    tracking_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для теста подключения
CREATE TABLE IF NOT EXISTS test_table (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 2. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_promo_active ON promo_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_position ON promo_blocks(position);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ===============================================
-- 3. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ updated_at
-- ===============================================

-- Функция для auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_updated_at 
    BEFORE UPDATE ON promo_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 4. ВКЛЮЧЕНИЕ RLS (Row Level Security)
-- ===============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 5. RLS ПОЛИТИКИ (разрешаем всё для админки)
-- ===============================================

-- Товары: разрешаем все операции
DROP POLICY IF EXISTS "Публичный доступ к товарам" ON products;
CREATE POLICY "Публичный доступ к товарам" ON products
    FOR SELECT USING (true);
CREATE POLICY "Разрешить добавление товаров" ON products
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Разрешить обновление товаров" ON products
    FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Разрешить удаление товаров" ON products
    FOR DELETE USING (true);

-- Категории: разрешаем все операции
DROP POLICY IF EXISTS "Публичный доступ к категориям" ON categories;
CREATE POLICY "Публичный доступ к категориям" ON categories
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Разрешить все операции с категориями" ON categories;
CREATE POLICY "Разрешить все операции с категориями" ON categories
    FOR ALL USING (true);

-- Баннеры: разрешаем все операции
DROP POLICY IF EXISTS "Публичный доступ к баннерам" ON promo_blocks;
CREATE POLICY "Публичный доступ к баннерам" ON promo_blocks
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Разрешить все операции с баннерами" ON promo_blocks;
CREATE POLICY "Разрешить все операции с баннерами" ON promo_blocks
    FOR ALL USING (true);

-- Заказы (пока открытый доступ для разработки)
DROP POLICY IF EXISTS "Пользователи видят свои заказы" ON orders;
CREATE POLICY "Пользователи видят свои заказы" ON orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Создание заказов" ON orders;
CREATE POLICY "Создание заказов" ON orders
    FOR INSERT WITH CHECK (true);

-- ===============================================
-- 6. ТЕСТОВЫЕ ДАННЫЕ
-- ===============================================

-- Добавляем категории
INSERT INTO categories (name, slug, is_active) VALUES 
('Электроника', 'electronics', true),
('Одежда', 'clothing', true),
('Книги', 'books', true)
ON CONFLICT DO NOTHING;

-- Добавляем товары
INSERT INTO products (category_id, name, slug, price, sku, stock_quantity, is_featured, image_url) VALUES
(1, 'Смартфон Apple iPhone 15', 'apple-iphone-15', 79999.00, 'SKU-001', 10, true, 'https://example.com/iphone15.jpg'),
(1, 'Ноутбук MacBook Pro', 'macbook-pro', 149999.00, 'SKU-002', 5, true, 'https://example.com/macbook.jpg'),
(2, 'Джинсы Levi''s', 'levis-jeans', 3999.00, 'SKU-003', 20, false, 'https://example.com/jeans.jpg'),
(3, 'Книга «Грокаем алгоритмы»', 'grokking-algorithms', 1299.00, 'SKU-004', 50, true, 'https://example.com/book.jpg')
ON CONFLICT (sku) DO NOTHING;

-- Добавляем промо-баннеры
INSERT INTO promo_blocks (title, image_url, link_url, position, is_active, sort_order, start_date) VALUES
('Скидка 30% на все товары!', 'https://example.com/sale.jpg', '/catalog?discount=30', 'homepage', true, 1, NOW()),
('Новая коллекция весна-лето', 'https://example.com/collection.jpg', '/catalog?season=spring', 'homepage', true, 2, NOW())
ON CONFLICT DO NOTHING;

-- Добавляем тестовую запись
INSERT INTO test_table (name) VALUES ('Success!')
ON CONFLICT DO NOTHING;

-- ===============================================
-- 7. КОММЕНТАРИИ
-- ===============================================

COMMENT ON TABLE products IS 'Таблица товаров интернет-магазина';
COMMENT ON TABLE categories IS 'Таблица категорий товаров';
COMMENT ON TABLE promo_blocks IS 'Таблица промо-баннеров';
COMMENT ON TABLE orders IS 'Таблица заказов';
COMMENT ON COLUMN products.status IS 'Статус товара: active, inactive, deleted';
COMMENT ON COLUMN orders.status IS 'Статус заказа: pending, paid, shipped, delivered, cancelled';

-- ===============================================
-- ГОТОВО!
-- ===============================================

-- Проверьте результат:
-- SELECT 'products' as table_name, COUNT(*) as count FROM products
-- UNION ALL
-- SELECT 'categories', COUNT(*) FROM categories
-- UNION ALL
-- SELECT 'promo_blocks', COUNT(*) FROM promo_blocks
-- UNION ALL
-- SELECT 'test_table', COUNT(*) FROM test_table;

