-- Проверка наличия данных в таблицах
-- Выполните этот SQL на Beget

-- Проверяем есть ли данные
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_banners FROM promo_blocks;

-- Проверяем конкретные записи
SELECT id, name, price FROM products LIMIT 5;
SELECT id, name FROM categories LIMIT 5;
SELECT id, title FROM promo_blocks LIMIT 5;

