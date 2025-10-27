# ARTECO Project

Проект с интеграцией GitHub, Vercel и Supabase.

## ✨ Статус проекта

- ✅ **GitHub** - Репозиторий создан и настроен
- ✅ **Vercel** - Проект развернут на https://arteco1-...
- ✅ **Supabase** - Библиотека установлена, готово к настройке

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone git@github.com:arteco6633/arteco1.git
cd arteco1
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=ваш_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
```

### 3. Запуск проекта

```bash
# Локальная разработка
npm run dev

# Деплой на Vercel
npm run deploy
```

## 📚 Технологии

- **GitHub** - Хранение кода и версионирование
- **Vercel** - Деплой и хостинг
- **Supabase** - База данных PostgreSQL с pgvector

## 🔧 Настройка Supabase

### Шаг 1: Создайте проект
1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите через GitHub
3. Создайте новый проект "ARTECO"
4. Выберите регион (рекомендуется ближайший к вам)

### Шаг 2: Получите API ключи
1. Откройте ваш проект в Supabase
2. Перейдите в **Settings** → **API**
3. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (опционально) → `SUPABASE_SERVICE_ROLE_KEY`

### Шаг 3: Включите расширение pgvector
```sql
-- Выполните в SQL Editor в Supabase Dashboard
CREATE EXTENSION IF NOT EXISTS vector;
```

### Шаг 4: Используйте в коде
```javascript
import { supabase } from './supabase.js'

// Пример использования
const { data, error } = await supabase
  .from('ваша_таблица')
  .select('*')
```

## 📝 Полезные ссылки

- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase + pgvector](https://supabase.com/docs/guides/ai)

