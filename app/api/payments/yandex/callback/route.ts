export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const raw = await req.text() // вебхук может присылать строку; пробуем парсить
    let payload: any
    try { payload = JSON.parse(raw) } catch { payload = { raw } }

    // TODO: верификация подписи (когда включим подпись в ЛК)

    const event = payload?.event || payload?.status
    const orderId = payload?.orderId || payload?.order_id

    // Логируем
    try {
      await supabase.from('payment_logs').insert({ provider: 'yandex_pay', event, payload })
    } catch {}

    if (orderId && event) {
      // Простая мапа статусов
      let status: string | null = null
      if (['paid','succeeded','success'].includes(String(event))) status = 'paid'
      if (['canceled','cancelled','failed'].includes(String(event))) status = 'cancelled'
      if (status) {
        await supabase.from('orders').update({ status }).eq('id', orderId).or(`order_number.eq.${orderId}`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown' }, { status: 500 })
  }
}


