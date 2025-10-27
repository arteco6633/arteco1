-- Обновление категорий для каталога мебели
-- Выполните этот SQL в Supabase SQL Editor

-- Обновляем существующие категории (включая slug)
UPDATE categories 
SET name = 'Кухни', 
    slug = 'kukhni',
    description = 'Кухонные гарнитуры и мебель для кухни' 
WHERE id = 1;

UPDATE categories 
SET name = 'Шкафы и стеллажи', 
    slug = 'shkafy-i-stellazhi',
    description = 'Шкафы, стеллажи и системы хранения' 
WHERE id = 2;

UPDATE categories 
SET name = 'Столы и стулья', 
    slug = 'stoly-i-stulya',
    description = 'Столы, стулья и обеденные группы' 
WHERE id = 3;

-- Добавляем новые категории, если их еще нет (с slug)
INSERT INTO categories (id, name, slug, description, created_at)
VALUES 
  (4, 'Комоды и тумбы', 'comody-i-tumby', 'Комоды, тумбы и прикроватные тумбы', NOW()),
  (5, 'Мягкая мебель', 'myagkaya-mebel', 'Диваны, кресла и другая мягкая мебель', NOW())
ON CONFLICT (id) DO NOTHING;

-- Обновляем секвенс
SELECT setval('categories_id_seq', 5, true);

