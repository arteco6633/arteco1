import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zijajicude.beget.app'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNTIzMjAwLCJleHAiOjE5MTkyODk2MDB9.l9rF02tJ4OKoCSqVsKeHnBR47mYkFG5BxF_Imkz9tcs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

