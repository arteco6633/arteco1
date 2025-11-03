import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'arteco_admin_token'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}


