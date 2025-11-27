import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Защита админки по cookie
// Кука устанавливается в /api/admin/login
const ADMIN_COOKIE_NAME = 'arteco_admin_token'
// Значение берется из переменной окружения для безопасности
const getAdminCookieValue = () => {
  const login = process.env.ADMIN_LOGIN || ''
  const password = process.env.ADMIN_PASSWORD || ''
  if (!login || !password) {
    console.error('ADMIN_LOGIN и ADMIN_PASSWORD должны быть установлены в переменных окружения')
    return ''
  }
  return `${login}:${password}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Защищаем все маршруты /admin, кроме страницы логина
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    const expectedToken = getAdminCookieValue()
    if (!expectedToken || token !== expectedToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      // сохраняем целевой маршрут, чтобы вернуть пользователя после логина
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}


