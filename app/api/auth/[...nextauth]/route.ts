import NextAuth from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zijajicude.beget.app'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(
  supabaseUrl,
  serviceRoleKey
) : null

const authOptions = {
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'phone',
      credentials: {
        phone: { label: 'phone', type: 'text' },
        code: { label: 'code', type: 'text' },
      },
      async authorize(creds) {
        if (!supabaseAdmin) {
          console.error('[nextauth] Supabase admin client not initialized')
          return null
        }
        
        const phone = (creds?.phone as string || '').replace(/\D/g,'')
        const norm = phone.startsWith('7') ? `+7${phone.slice(1)}` : (phone.startsWith('8') ? `+7${phone.slice(1)}` : `+${phone}`)
        const code = (creds?.code as string || '').trim()

        try {
          const { data: otp } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('phone', norm)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!otp) return null
          const notExpired = new Date(otp.expires_at).getTime() > Date.now()
          if (!notExpired || otp.code !== code) return null

          // upsert user
          const { data: userRow } = await supabaseAdmin
            .from('users_local')
            .upsert({ phone: norm }, { onConflict: 'phone' })
            .select('*')
            .maybeSingle()

          return { id: userRow?.id || norm, name: userRow?.name || norm, phone: norm } as any
        } catch (error) {
          console.error('[nextauth] Authorize error:', error)
          return null
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
  pages: {
    signIn: '/',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = (user as any).phone || token.phone
      }
      return token
    },
    async session({ session, token }) {
      (session as any).phone = (token as any).phone
      return session
    },
    async signIn({ user, account, profile }) {
      if (!supabaseAdmin) {
        console.warn('[nextauth] Supabase admin client not initialized, skipping profile sync')
        return true
      }
      try {
        // Синхронизируем профиль в Supabase (простая upsert в таблицу profiles)
        await supabaseAdmin.from('oauth_profiles').upsert({
          provider: 'yandex',
          provider_user_id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: (user as any)?.image || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'provider,provider_user_id' })
      } catch (e) {
        console.error('profiles upsert error', e)
      }
      return true
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }


