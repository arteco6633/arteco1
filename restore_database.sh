#!/bin/bash

# Скрипт для восстановления базы данных ARTECO
# Использование: ./restore_database.sh

echo "🔄 Начинаем восстановление базы данных ARTECO..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия SQL файлов
if [ ! -f "database_schema.sql" ]; then
    echo -e "${RED}❌ Файл database_schema.sql не найден!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Порядок выполнения SQL скриптов:${NC}"
echo ""

# Основная схема
echo -e "${GREEN}1. Основная схема базы данных${NC}"
echo "   → database_schema.sql"
echo ""

# Дополнительные настройки
echo -e "${GREEN}2. Настройка аутентификации${NC}"
echo "   → setup_auth_local.sql"
echo ""

echo -e "${GREEN}3. Основные таблицы${NC}"
echo "   → setup_categories_position.sql"
echo "   → setup_journal.sql"
echo "   → setup_orders.sql"
echo "   → setup_partners.sql"
echo "   → setup_payment_logs.sql"
echo ""

echo -e "${GREEN}4. Настройка товаров${NC}"
echo "   → setup_product_modules.sql"
echo "   → setup_products_color_links.sql"
echo "   → setup_products_cost_price.sql"
echo "   → setup_products_custom_size.sql"
echo "   → setup_products_fast_delivery.sql"
echo "   → setup_products_handles.sql"
echo "   → setup_products_interior_images.sql"
echo "   → setup_products_is_hidden.sql"
echo "   → setup_products_original_price.sql"
echo "   → setup_products_rich_content.sql"
echo ""

echo -e "${GREEN}5. Дополнительные функции${NC}"
echo "   → setup_promo_blocks_video.sql"
echo "   → setup_quiz.sql"
echo "   → setup_kitchen_matchmaker_quiz.sql"
echo "   → setup_game.sql"
echo "   → setup_callback_requests.sql"
echo "   → setup_oauth_profiles.sql"
echo ""

echo -e "${GREEN}6. Storage (изображения)${NC}"
echo "   → setup_storage.sql"
echo "   → setup_storage_bucket.sql"
echo "   → setup_storage_categories.sql"
echo ""

echo -e "${GREEN}7. Безопасность (RLS)${NC}"
echo "   → fix_rls_simple.sql"
echo "   → fix_rls_policies.sql"
echo "   → fix_rls_complete.sql"
echo ""

echo -e "${GREEN}8. Оптимизация${NC}"
echo "   → setup_database_indexes_performance.sql"
echo ""

echo -e "${YELLOW}📝 Инструкция:${NC}"
echo ""
echo "1. Откройте Supabase Dashboard → SQL Editor"
echo "2. Скопируйте содержимое каждого файла в указанном порядке"
echo "3. Выполните каждый скрипт по очереди"
echo ""
echo -e "${YELLOW}Или используйте Supabase CLI:${NC}"
echo ""
echo "  supabase db reset"
echo "  supabase db push"
echo ""
echo -e "${GREEN}✅ Готово! Следуйте инструкциям выше.${NC}"

