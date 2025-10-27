// Конфигурация Supabase
// Это файл для подключения к базе данных Supabase

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// URL и ключ Supabase (ваш собственный Supabase на Beget)
const supabaseUrl = 'https://zijajicude.beget.app'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNTIzMjAwLCJleHAiOjE5MTkyODk2MDB9.l9rF02tJ4OKoCSqVsKeHnBR47mYkFG5BxF_Imkz9tcs'

// Создаём клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase подключен:', supabaseUrl)

