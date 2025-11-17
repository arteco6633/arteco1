export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Обработка callback'ов от Долями
 * Документация: https://dolyame.ru/develop/api/
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('=== Долями Callback - Incoming Request ===')
    console.log('Body:', JSON.stringify(body, null, 2))

    const orderId = body?.order_id || body?.orderId
    const status = body?.status
    const amount = body?.amount

    if (!orderId) {
      console.error('Order ID missing in callback')
      return NextResponse.json(
        { ok: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Логируем callback
    try {
      await supabase.from('payment_logs').insert({
        provider: 'dolyame',
        event: status || 'callback',
        order_id: String(orderId),
        payload: body,
      })
    } catch (logError: any) {
      console.error('Error logging callback:', logError)
    }

    // Маппинг статусов Долями на внутренние статусы заказа
    // Статусы Долями: approved, rejected, cancelled, refunded
    let orderStatus: string | null = null
    
    if (status === 'approved' || status === 'paid') {
      orderStatus = 'paid'
    } else if (status === 'rejected' || status === 'cancelled' || status === 'canceled') {
      orderStatus = 'cancelled'
    } else if (status === 'refunded') {
      orderStatus = 'refunded'
    }

    // Обновляем статус заказа в базе данных
    if (orderStatus) {
      try {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: orderStatus })
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)

        if (updateError) {
          console.error('Error updating order status:', updateError)
        } else {
          console.log(`Order ${orderId} status updated to ${orderStatus}`)
        }
      } catch (updateError: any) {
        console.error('Error updating order:', updateError)
      }
    }

    // Долями ожидает ответ в формате JSON
    return NextResponse.json({
      ok: true,
      status: 'received',
    })
  } catch (e: any) {
    console.error('Долями callback error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

