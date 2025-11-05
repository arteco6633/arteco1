export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const merchantId = process.env.YANDEX_MERCHANT_ID || process.env.NEXT_PUBLIC_YANDEX_MERCHANT_ID
    const apiKey = process.env.YANDEX_PAY_API_KEY
    const env = process.env.YANDEX_PAY_ENV || 'test'

    if (!merchantId || !apiKey) {
      return NextResponse.json({ ok: false, error: 'YANDEX env not configured' }, { status: 500 })
    }

    const amount = Number(body?.amount || 0)
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 })
    }

    // Здесь можно обращаться к API Яндекс Пэй для создания намерения платежа.
    // Пока возвращаем данные для инициализации Web SDK на клиенте.
    const orderId = body?.orderId || `draft_${Date.now()}`

    // Вернём минимально необходимое для формирования paymentData на клиенте
    return NextResponse.json({ ok: true, env, merchantId, orderId, amount, currency: 'RUB' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown' }, { status: 500 })
  }
}


