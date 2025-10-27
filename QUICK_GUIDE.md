# 🚀 Быстрая шпаргалка по проекту ARTECO

## 📋 Что уже настроено

### GitHub
```bash
# Проверить статус
git status

# Отправить изменения
git add .
git commit -m "описание изменений"
git push origin main
```

### Vercel
- Автоматический деплой при каждом push на GitHub
- Домен: `arteco1.vercel.app`
- Переменные окружения настроены

### Supabase
- БД подключена
- Клиент настроен в `supabase.js`
- Пример использования в `test-supabase.html`

---

## 🛠 Команды для разработки

### Локально
```bash
# Установить зависимости
npm install

# Запустить локальный сервер
npm run dev

# Проверить Supabase
open test-supabase.html
```

### Развёртывание
```bash
# Отправить на GitHub (автоматически задеплоится на Vercel)
git add .
git commit -m "ваше сообщение"
git push origin main
```

---

## 💾 Работа с Supabase

### В файле `supabase.js`:
```javascript
import { supabase } from './supabase.js'

// Получить все записи
const { data, error } = await supabase
  .from('test_table')
  .select('*')

// Добавить запись
const { data, error } = await supabase
  .from('test_table')
  .insert([{ name: 'Новая запись' }])

// Обновить запись
const { data, error } = await supabase
  .from('test_table')
  .update({ name: 'Обновлено' })
  .eq('id', 1)

// Удалить запись
const { data, error } = await supabase
  .from('test_table')
  .delete()
  .eq('id', 1)
```

---

## 🌐 Ссылки на проект

- **GitHub**: https://github.com/arteco6633/arteco1
- **Vercel**: https://arteco1.vercel.app
- **Supabase**: https://supabase.com/dashboard (откройте проект Arteco)

---

## 🔧 Добавление pgvector (для работы с векторами)

В Supabase Dashboard → SQL Editor выполните:
```sql
-- Включить расширение
CREATE EXTENSION IF NOT EXISTS vector;

-- Создать таблицу с векторами
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),  -- размерность вашего вектора
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📝 Следующие шаги

1. ✅ Замените `index.html` на свой проект
2. ✅ Создайте структуру базы данных
3. ✅ Настройте Row Level Security (RLS) в Supabase
4. ✅ Добавьте аутентификацию пользователей
5. ✅ Разработайте функционал

Удачи! 🎉

