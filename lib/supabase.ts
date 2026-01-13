import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// КРИТИЧНО: Не используем fallback на старый URL - это блокирует загрузку сайта
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не установлены!')
  console.error('Проверьте переменные окружения на Vercel и в .env.local')
}

// Создаем клиент только если есть URL и ключ
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null as any // Временное решение - будет ошибка при использовании, но сайт загрузится

