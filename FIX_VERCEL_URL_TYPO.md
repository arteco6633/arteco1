# КРИТИЧНО: Исправление опечатки в URL на Vercel

## ПРОБЛЕМА НАЙДЕНА!

На Vercel в переменной `NEXT_PUBLIC_SUPABASE_URL` опечатка:
- ❌ НЕПРАВИЛЬНО: `https://iwamliov1phpfnghqngn.supabase.co` (с цифрой `1`)
- ✅ ПРАВИЛЬНО: `https://iwamliovlphpfnghqngn.supabase.co` (с буквой `l`)

## Как исправить:

1. **Vercel Dashboard** → Settings → Environment Variables
2. Найдите `NEXT_PUBLIC_SUPABASE_URL`
3. Нажмите **три точки (⋮)** → **Edit**
4. Замените значение на: `https://iwamliovlphpfnghqngn.supabase.co`
   - **ВАЖНО**: Используйте букву `l` (эль), НЕ цифру `1`
5. Нажмите **Save**
6. **Deployments** → найдите последний деплой → **Redeploy**

## Проверка других переменных:

Убедитесь, что все переменные правильные:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://iwamliovlphpfnghqngn.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_-9ggsV5Yxry9JTqYwsshJQ_ncSA3OWG`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_1ac0VJ6LoKgKqYUL3Bjobg_9OMbSTe7`

**После исправления выполните Redeploy!**
