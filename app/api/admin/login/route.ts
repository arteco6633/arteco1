import { NextResponse } from 'next/server'

const ADMIN_LOGIN = 'arteco'
const ADMIN_PASSWORD = '8926416s'
const ADMIN_COOKIE_NAME = 'arteco_admin_token'
const ADMIN_COOKIE_VALUE = `${ADMIN_LOGIN}:${ADMIN_PASSWORD}`

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json()

    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ ok: true })
      res.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
        httpOnly: true,
        sameSite: 'lax',
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


