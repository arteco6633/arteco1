export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API роут для создания платежа через Яндекс Pay
 * Документация: https://pay.yandex.ru/docs/ru/custom/integration-guide
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('=== Yandex Pay Create - Incoming Request ===')
    console.log('Body:', JSON.stringify(body, null, 2))

    // Поддержка разных вариантов названий переменных для совместимости
    const merchantId = 
      process.env.YANDEX_PAY_MERCHANT_ID || 
      process.env.YANDEX_MERCHANT_ID ||
      process.env.NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID ||
      process.env.NEXT_PUBLIC_YANDEX_MERCHANT_ID
    const apiKey = process.env.YANDEX_PAY_API_KEY || process.env.YANDEX_API_KEY
    const env = process.env.YANDEX_PAY_ENV || 'test' // 'test' или 'production'
    const enableSplit = process.env.YANDEX_PAY_ENABLE_SPLIT === 'true'

    if (!merchantId) {
      console.error('Yandex Pay: Merchant ID not configured')
      return NextResponse.json(
        { ok: false, error: 'YANDEX_PAY_MERCHANT_ID not configured' },
        { status: 500 }
      )
    }

    const amount = Number(body?.amount || 0)
    const orderId = body?.orderId
    const items = body?.items || []

    if (!amount || amount <= 0) {
      console.error('Yandex Pay: Invalid amount:', amount)
      return NextResponse.json(
        { ok: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Если orderId не передан, создаем временный ID для черновика
    // В реальном сценарии orderId должен быть создан заранее при создании заказа
    const finalOrderId = orderId || `draft_${Date.now()}`

    console.log('=== Yandex Pay Create Response ===')
    console.log('Merchant ID:', merchantId)
    console.log('Environment:', env)
    console.log('Order ID:', finalOrderId)
    console.log('Amount:', amount)
    console.log('Split enabled:', enableSplit)

    // Возвращаем данные для инициализации Web SDK на клиенте
    // Web SDK сам создаст платеж через Яндекс Pay API
    return NextResponse.json({
      ok: true,
      env, // 'test' или 'production'
      merchantId,
      orderId: finalOrderId,
      amount: amount.toFixed(2),
      currency: 'RUB',
      enableSplit, // Флаг для включения Split (оплата частями)
    })
  } catch (e: any) {
    console.error('Yandex Pay create error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
