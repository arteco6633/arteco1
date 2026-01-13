# КРИТИЧНО: Проверка статуса Supabase

## Проблема
Ошибки 503 при запросах к Supabase. Контент не загружается.

## Что проверить СРОЧНО:

### 1. Проверьте статус Supabase проекта
1. Зайдите в https://supabase.com/dashboard
2. Выберите ваш проект
3. **ПРОВЕРЬТЕ СТАТУС ПРОЕКТА**:
   - Проект должен быть **ACTIVE** (активен)
   - Если статус **PAUSED** (приостановлен) - нажмите "Resume" или "Restore"
   - Если проекта нет - нужно создать новый

### 2. Проверьте URL Supabase проекта
1. В Supabase Dashboard → Settings → API
2. Скопируйте **Project URL** (должен быть типа `https://xxxxx.supabase.co`)
3. Проверьте, что этот URL совпадает с переменной `NEXT_PUBLIC_SUPABASE_URL` на Vercel

### 3. Проверьте переменные окружения на Vercel ЕЩЕ РАЗ
1. Vercel Dashboard → Settings → Environment Variables
2. Убедитесь, что `NEXT_PUBLIC_SUPABASE_URL` содержит URL из шага 2
3. Убедитесь, что `NEXT_PUBLIC_SUPABASE_ANON_KEY` правильный
4. **ВАЖНО**: Убедитесь, что переменные установлены для **Production**
5. После проверки выполните **Redeploy**

### 4. Проверьте, доступен ли Supabase URL
Откройте в браузере ваш Supabase URL (например, `https://xxxxx.supabase.co`)
- Если открывается - Supabase доступен
- Если ошибка - Supabase недоступен, проект приостановлен

### 5. Проверьте логи Vercel
1. Vercel Dashboard → Deployments → последний деплой → Logs
2. Проверьте, нет ли ошибок типа "Missing environment variable"
3. Проверьте, правильно ли применяются переменные окружения

## Временное решение (если Supabase приостановлен)

Если проект приостановлен:
1. Зайдите в Supabase Dashboard
2. Выберите проект
3. Нажмите **"Restore"** или **"Resume"**
4. Подождите 1-2 минуты, пока проект восстановится
5. Проверьте, что проект активен
6. Выполните Redeploy на Vercel
