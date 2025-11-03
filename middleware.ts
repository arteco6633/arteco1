import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Простейшая защита админки по cookie
// Кука устанавливается в /api/admin/login
const ADMIN_COOKIE_NAME = 'arteco_admin_token'
const ADMIN_COOKIE_VALUE = 'arteco:8926416s'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Защищаем все маршруты /admin, кроме страницы логина
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    if (token !== ADMIN_COOKIE_VALUE) {
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


