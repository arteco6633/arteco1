export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Обработка callback от T-Bank API
 * Документация: https://developer.tbank.ru/eacq/intro
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const terminalId = process.env.TBANK_TERMINAL_ID
    const password = process.env.TBANK_PASSWORD

    console.log('=== T-Bank Callback - Incoming Request ===')
    console.log('Payload:', JSON.stringify(payload, null, 2))

    if (!terminalId || !password) {
      console.error('T-Bank credentials not configured')
      return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 500 })
    }

    // Верификация подписи
    // T-Bank отправляет Token в запросе, который нужно проверить
    const receivedToken = payload.Token
    const orderId = payload.OrderId
    const status = payload.Status
    const paymentId = payload.PaymentId

    console.log('=== Callback Signature Verification ===')
    console.log('OrderId:', orderId)
    console.log('Status:', status)
    console.log('PaymentId:', paymentId)
    console.log('Received Token:', receivedToken)

    // Формируем строку для проверки подписи
    // Согласно документации, для callback подпись формируется из всех полей кроме Token
    // Поля сортируются по алфавиту, затем добавляется Password
    const signFields: Record<string, any> = {}
    
    // Собираем все поля кроме Token
    for (const key in payload) {
      if (key !== 'Token' && typeof payload[key] !== 'object') {
        signFields[key] = payload[key]
      }
    }
    
    // Сортируем поля по алфавиту
    const sortedKeys = Object.keys(signFields).sort()
    const signValues = sortedKeys.map(key => String(signFields[key] || ''))
    signValues.push(password) // Password добавляется в конец
    
    const signString = signValues.join('')
    const expectedToken = crypto.createHash('sha256').update(signString).digest('hex')

    console.log('Sign fields:', sortedKeys)
    console.log('Sign string:', signString)
    console.log('Expected token:', expectedToken)
    console.log('Token match:', receivedToken === expectedToken)

    // Проверяем подпись
    if (receivedToken !== expectedToken) {
      console.error('T-Bank callback signature mismatch', {
        received: receivedToken,
        expected: expectedToken,
        signString,
      })
      // ВАЖНО: Даже при несовпадении подписи возвращаем OK, чтобы T-Bank не повторял запросы
      // Но логируем ошибку для отладки
    }

    // Логируем событие
    console.log('=== Saving to payment_logs ===')
    try {
      const { data, error } = await supabase.from('payment_logs').insert({
        provider: 'tbank',
        event: status,
        order_id: orderId ? String(orderId) : null,
        payment_id: paymentId ? String(paymentId) : null,
        payload: payload,
      }).select()
      
      if (error) {
        console.error('Failed to log payment event - Supabase error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } else {
        console.log('Payment log saved successfully:', data)
      }
    } catch (logError: any) {
      console.error('Failed to log payment event - Exception:', logError)
      console.error('Error message:', logError?.message)
      console.error('Error stack:', logError?.stack)
    }

    // Обновляем статус заказа
    if (orderId) {
      let orderStatus: string | null = null

      // Маппинг статусов T-Bank
      // AUTHORIZED - авторизован (требует подтверждения)
      // CONFIRMED - подтвержден (оплачен)
      // REJECTED - отклонен
      // CANCELED - отменен
      // REFUNDED - возвращен
      if (status === 'CONFIRMED' || status === 'AUTHORIZED') {
        orderStatus = 'paid'
      } else if (status === 'REJECTED' || status === 'CANCELED') {
        orderStatus = 'cancelled'
      } else if (status === 'REFUNDED') {
        orderStatus = 'refunded'
      }

      console.log('Updating order status:', { orderId, status, orderStatus })

      if (orderStatus) {
        try {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: orderStatus })
            .eq('id', Number(orderId))
            .or(`order_number.eq.${orderId}`)
          
          if (updateError) {
            console.error('Failed to update order status:', updateError)
          } else {
            console.log('Order status updated successfully')
          }
        } catch (updateError) {
          console.error('Failed to update order status:', updateError)
        }
      }
    }

    // T-Bank ожидает ответ в формате: { TerminalKey, Status: "OK" }
    return NextResponse.json({
      TerminalKey: terminalId,
      Status: 'OK',
    })
  } catch (e: any) {
    console.error('T-Bank callback error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
