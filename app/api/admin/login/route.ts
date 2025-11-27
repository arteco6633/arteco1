import { NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'

// Безопасность: используем переменные окружения вместо хардкода
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const ADMIN_COOKIE_NAME = 'arteco_admin_token'

const getAdminCookieValue = () => {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
    return ''
  }
  return `${ADMIN_LOGIN}:${ADMIN_PASSWORD}`
}

export async function POST(req: Request) {
  try {
    // Rate limiting для защиты от брутфорса
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimiters.login(`admin-login:${ip}`)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { ok: false, error: 'Слишком много попыток. Попробуйте позже.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
          }
        }
      )
    }

    const { login, password } = await req.json()

    // Проверяем наличие переменных окружения
    if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
      console.error('ADMIN_LOGIN и ADMIN_PASSWORD должны быть установлены в переменных окружения')
      return NextResponse.json({ ok: false, error: 'Серверная ошибка конфигурации' }, { status: 500 })
    }

    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ ok: true })
      const cookieValue = getAdminCookieValue()
      res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Только HTTPS в продакшене
        sameSite: 'strict', // Строгая защита от CSRF
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
      })
      return res
    }

    return NextResponse.json({ ok: false, error: 'Неверные данные' }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }
}


