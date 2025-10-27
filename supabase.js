// Конфигурация Supabase
// Это файл для подключения к базе данных Supabase

import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Создаём клиент Supabase
// Это клиент с публичным ключом (anon key) - безопасен для использования на клиенте
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Для серверных запросов с правами администратора используйте service_role key
// const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)

