# 🎯 Следующие шаги разработки MVP

## ✅ Что уже готово:

1. ✅ База данных создана (6 таблиц)
2. ✅ Тестовые данные загружены
3. ✅ Структура проекта настроена
4. ✅ GitHub подключен
5. ✅ Vercel развернут
6. ✅ Supabase настроен

---

## 🚀 План разработки (по приоритетам):

### 🔴 MUST HAVE - Приоритет #1

#### 1. Админ-панель (CRUD товаров)

**Файлы для создания:**
- `admin/index.html` - главная страница админки
- `admin/products.html` - список товаров
- `admin/product-form.html` - форма создания/редактирования
- `admin/product-form.js` - логика CRUD операций

**Что нужно реализовать:**

**LIST (Список товаров):**
```javascript
// Получить все товары
const { data, error } = await supabase
  .from('products')
  .select('*, categories(name)')
  .order('created_at', { ascending: false })

// Отобразить в таблице с колонками:
// ID | Название | Цена | Категория | Статус | Действия
```

**CREATE (Добавление товара):**
```javascript
// Валидация формы
// Загрузка изображения в Supabase Storage
// Вставка данных в таблицу products
const { data, error } = await supabase
  .from('products')
  .insert([{
    name: 'Название товара',
    price: 1000.00,
    stock_quantity: 10,
    category_id: 1,
    sku: 'SKU-001',
    status: 'active'
  }])
```

**UPDATE (Редактирование):**
```javascript
// Загрузка существующих данных
// Обновление записи
const { data, error } = await supabase
  .from('products')
  .update({
    name: 'Обновленное название',
    updated_at: 'NOW()'
  })
  .eq('id', productId)
```

**DELETE (Удаление):**
```javascript
// Мягкое удаление (статус = 'deleted')
const { data, error } = await supabase
  .from('products')
  .update({ status: 'deleted' })
  .eq('id', productId)
```

#### 2. CRUD промо-баннеров

Аналогично товарам, но для таблицы `promo_blocks`

#### 3. Главная страница магазина

**Файл: `index.html` (перезаписать)**

**Нужно реализовать:**
1. Загрузка активных промо-баннеров из Supabase
2. Блок "Хиты продаж" (is_featured=true)
3. Блок "Новинки" (по дате создания)
4. Список категорий

**Пример кода:**
```javascript
import { supabase } from './supabase.js'

// Загрузить промо-баннеры
const { data: banners } = await supabase
  .from('promo_blocks')
  .select('*')
  .eq('is_active', true)
  .eq('position', 'homepage')
  .order('sort_order')

// Загрузить хиты продаж
const { data: featured } = await supabase
  .from('products')
  .select('*')
  .eq('is_featured', true)
  .eq('status', 'active')
  .limit(8)

// Загрузить новинки
const { data: newProducts } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(8)

// Загрузить категории
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('sort_order')
```

---

### 🟡 SHOULD HAVE - Приоритет #2

#### 4. Каталог товаров

**Файл: `catalog.html`**

**Требования:**
- Список товаров (grid 3-4 колонки)
- Фильтр по категориям
- Поиск по названию
- Сортировка (по цене, дате, популярности)
- Пагинация

#### 5. Карточка товара

**Файл: `product.html`**

**Требования:**
- Детальная информация о товаре
- Изображения
- Кнопка "В корзину"
- Выбор количества
- Проверка наличия

#### 6. Корзина

**Файл: `cart.html`**

**Требования:**
- Список товаров
- Изменение количества
- Удаление
- Автопересчет суммы
- Хранение в localStorage

---

### 🟢 COULD HAVE - Приоритет #3

7. Оформление заказа
8. Личный кабинет
9. Аутентификация
10. Продвинутые фильтры

---

## 🛠 Структура файлов проекта

```
arteco/
├── index.html              # Главная страница магазина
├── catalog.html            # Каталог товаров
├── product.html            # Карточка товара
├── cart.html               # Корзина
├── checkout.html           # Оформление заказа
├── admin/
│   ├── index.html          # Дашборд админки
│   ├── products.html       # Список товаров
│   ├── product-form.html   # Форма товара
│   ├── banners.html        # Управление баннерами
│   └── orders.html         # Заказы
├── supabase.js             # Клиент Supabase
├── .env.local             # Переменные окружения
├── assets/
│   ├── css/
│   │   └── style.css       # Стили
│   └── js/
│       ├── main.js         # Основная логика
│       ├── cart.js         # Корзина
│       └── admin.js        # Админ-панель
└── README.md
```

---

## 💡 Рекомендации по разработке

### 1. Начните с админ-панели
Почему? Вам нужны данные (товары) для работы магазина.

### 2. Используйте модульную структуру
- Каждая страница - отдельный файл
- Общие функции выносите в модули
- Переиспользуйте код

### 3. Адаптивный дизайн
- Mobile-first подход
- Используйте CSS Grid и Flexbox
- Проверяйте на разных устройствах

### 4. Валидация данных
- Проверяйте все вводимые данные
- Показывайте понятные сообщения об ошибках
- Используйте встроенные HTML5 валидации

### 5. Оптимизация изображений
- Загружайте в Supabase Storage
- Используйте формат WebP
- Добавьте lazy loading

---

## 📝 Полезные команды

### Работа с Git
```bash
# Проверить статус
git status

# Добавить изменения
git add .

# Закоммитить
git commit -m "описание изменений"

# Отправить на GitHub
git push origin main
```

### Vercel автоматически деплоит при каждом push!

### Работа с Supabase
```javascript
// Открыть в браузере
import { supabase } from './supabase.js'

// Все CRUD операции
const { data, error } = await supabase
  .from('table_name')
  .select('*')           // READ
  .insert([{...}])       // CREATE
  .update({...}).eq()    // UPDATE
  .delete().eq()         // DELETE
```

---

## 🎓 Обучающие материалы

- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [HTML Forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
- [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

**Удачи в разработке! 🚀**

