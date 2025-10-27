// Конфигурация Supabase
// Это файл для подключения к базе данных Supabase

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// URL и ключ Supabase (для браузерной среды)
const supabaseUrl = 'https://omfffkpochfembpeikjz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZmZma3BvY2hmZW1icGVpa2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjM3OTUsImV4cCI6MjA3Njc5OTc5NX0.H-bkBj0cHvlIYkqeLIhH6ESmkmw8t2Rn5wF8R_9u898'

// Создаём клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase подключен:', supabaseUrl)

