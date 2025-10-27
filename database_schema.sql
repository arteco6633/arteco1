-- ===============================================
-- SQL схема для MVP интернет-магазина
-- ===============================================

-- 1. Таблица категорий
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

-- 2. Таблица товаров
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

-- 3. Таблица промо-баннеров
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

-- 4. Таблица пользователей (используем Supabase Auth, эта таблица для дополнительных данных)
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

-- 5. Таблица заказов
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

-- 6. Таблица элементов заказа
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

-- ===============================================
-- Индексы для ускорения запросов
-- ===============================================

-- Индексы для products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Индексы для categories
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Индексы для promo_blocks
CREATE INDEX IF NOT EXISTS idx_promo_active ON promo_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_position ON promo_blocks(position);

-- Индексы для orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Индексы для order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ===============================================
-- Автоматическое обновление updated_at
-- ===============================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
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
-- Тестовые данные
-- ===============================================

-- Добавляем категории
INSERT INTO categories (name, slug, is_active) VALUES 
('Электроника', 'electronics', true),
('Одежда', 'clothing', true),
('Книги', 'books', true);

-- Добавляем товары
INSERT INTO products (category_id, name, slug, price, sku, stock_quantity, is_featured, image_url) VALUES
(1, 'Смартфон Apple iPhone 15', 'apple-iphone-15', 79999.00, 'SKU-001', 10, true, 'https://example.com/iphone15.jpg'),
(1, 'Ноутбук MacBook Pro', 'macbook-pro', 149999.00, 'SKU-002', 5, true, 'https://example.com/macbook.jpg'),
(2, 'Джинсы Levi''s', 'levis-jeans', 3999.00, 'SKU-003', 20, false, 'https://example.com/jeans.jpg'),
(3, 'Книга «Грокаем алгоритмы»', 'grokking-algorithms', 1299.00, 'SKU-004', 50, true, 'https://example.com/book.jpg');

-- Добавляем промо-баннеры
INSERT INTO promo_blocks (title, image_url, link_url, position, is_active, sort_order, start_date) VALUES
('Скидка 30% на все товары!', 'https://example.com/sale.jpg', '/catalog?discount=30', 'homepage', true, 1, NOW()),
('Новая коллекция весна-лето', 'https://example.com/collection.jpg', '/catalog?season=spring', 'homepage', true, 2, NOW());

-- ===============================================
-- RLS (Row Level Security) политики
-- ===============================================

-- Включаем RLS для таблиц
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политика: Все могут читать товары и категории
CREATE POLICY "Публичный доступ к товарам" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Публичный доступ к категориям" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Публичный доступ к баннерам" ON promo_blocks
    FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- Политика: Пользователи видят только свои заказы
CREATE POLICY "Пользователи видят свои заказы" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи видят свои элементы заказов" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Политика: Пользователи могут создавать заказы
CREATE POLICY "Создание заказов" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===============================================
-- Полезные функции для запросов
-- ===============================================

-- Функция для получения товаров с фильтрацией
CREATE OR REPLACE FUNCTION get_products(
    p_category_id INTEGER DEFAULT NULL,
    p_is_featured BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    name VARCHAR,
    price DECIMAL,
    image_url TEXT,
    slug VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.slug
    FROM products p
    WHERE p.status = 'active'
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_is_featured IS NULL OR p.is_featured = p_is_featured)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Функция для генерации номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    SELECT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_seq')::TEXT, 6, '0')
    INTO new_number;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Комментарии к таблицам и полям
-- ===============================================

COMMENT ON TABLE products IS 'Таблица товаров интернет-магазина';
COMMENT ON TABLE categories IS 'Таблица категорий товаров';
COMMENT ON TABLE promo_blocks IS 'Таблица промо-баннеров';
COMMENT ON TABLE orders IS 'Таблица заказов';
COMMENT ON TABLE order_items IS 'Таблица элементов заказа';

COMMENT ON COLUMN products.status IS 'Статус товара: active, inactive, deleted';
COMMENT ON COLUMN orders.status IS 'Статус заказа: pending, paid, shipped, delivered, cancelled';
COMMENT ON COLUMN promo_blocks.position IS 'Позиция баннера: homepage, top, middle, bottom';

