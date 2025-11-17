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
 * API роут для обработки webhook от Яндекс Pay
 * Документация: https://pay.yandex.ru/docs/ru/custom/backend/merchant-api/
 * 
 * Настройка в личном кабинете:
 * - Перейдите в Настройки → Callback URL
 * - Укажите: https://your-domain.com/api/payments/yandex/callback
 * - Включите подпись сообщений (рекомендуется)
 */
export async function POST(req: Request) {
  try {
    // Получаем сырое тело запроса для верификации подписи
    const rawBody = await req.text()
    console.log('=== Yandex Pay Callback - Incoming Request ===')
    console.log('Raw body length:', rawBody.length)
    console.log('Raw body (first 500 chars):', rawBody.substring(0, 500))

    // Получаем заголовки для верификации подписи
    const signature = req.headers.get('X-Yandex-Pay-Signature') || req.headers.get('x-yandex-pay-signature')
    const contentType = req.headers.get('content-type') || ''

    console.log('Headers:')
    console.log('  Content-Type:', contentType)
    console.log('  Signature:', signature ? 'present' : 'missing')

    // Декодирование сообщения
    let payload: any

    // Проверяем, если данные приходят в base64 (согласно документации Merchant API)
    if (contentType.includes('application/json')) {
      // Стандартный JSON
      try {
        payload = JSON.parse(rawBody)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        // Пробуем декодировать base64, если JSON не парсится
        try {
          const decoded = Buffer.from(rawBody, 'base64').toString('utf-8')
          payload = JSON.parse(decoded)
          console.log('Successfully decoded from base64')
        } catch (e2) {
          console.error('Failed to decode base64:', e2)
          payload = { raw: rawBody }
        }
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // URL-encoded форма
      const params = new URLSearchParams(rawBody)
      payload = Object.fromEntries(params)
    } else {
      // Пробуем разные варианты декодирования
      try {
        payload = JSON.parse(rawBody)
      } catch (e) {
        try {
          // Пробуем base64 декодирование
          const decoded = Buffer.from(rawBody, 'base64').toString('utf-8')
          payload = JSON.parse(decoded)
          console.log('Decoded from base64')
        } catch (e2) {
          console.error('Failed to decode:', e2)
          payload = { raw: rawBody }
        }
      }
    }

    console.log('Parsed payload:', JSON.stringify(payload, null, 2))

    // Верификация подписи (если включена в личном кабинете)
    // Поддержка разных вариантов названий переменных
    const secretKey = 
      process.env.YANDEX_PAY_SECRET_KEY || 
      process.env.YANDEX_PAY_API_KEY ||
      process.env.YANDEX_API_KEY ||
      process.env.YANDEX_SECRET_KEY
    if (signature && secretKey) {
      try {
        // Согласно документации Яндекс Pay, подпись формируется как HMAC-SHA256
        // Формат: HMAC-SHA256(rawBody, secretKey)
        const expectedSignature = crypto
          .createHmac('sha256', secretKey)
          .update(rawBody)
          .digest('hex')

        // Яндекс Pay может отправлять подпись в разных форматах
        // Проверяем оба варианта: hex и base64
        const signatureHex = signature.toLowerCase()
        const signatureBase64 = Buffer.from(signatureHex, 'hex').toString('base64')
        const expectedSignatureBase64 = Buffer.from(expectedSignature, 'hex').toString('base64')

        const isValidHex = signatureHex === expectedSignature.toLowerCase()
        const isValidBase64 = signature === expectedSignatureBase64 || signature === signatureBase64

        if (!isValidHex && !isValidBase64) {
          console.error('=== Signature verification failed ===')
          console.error('Expected (hex):', expectedSignature)
          console.error('Received:', signature)
          console.error('Body:', rawBody.substring(0, 200))

          // В тестовой среде можно пропустить проверку подписи
          if (process.env.YANDEX_PAY_ENV === 'production') {
            return NextResponse.json(
              { ok: false, error: 'Invalid signature' },
              { status: 401 }
            )
          } else {
            console.warn('Signature verification failed, but continuing in test mode')
          }
        } else {
          console.log('✓ Signature verified successfully')
        }
      } catch (sigError: any) {
        console.error('Signature verification error:', sigError.message)
        // В тестовой среде продолжаем без проверки подписи
        if (process.env.YANDEX_PAY_ENV === 'production') {
          return NextResponse.json(
            { ok: false, error: 'Signature verification error' },
            { status: 401 }
          )
        }
      }
    } else if (process.env.YANDEX_PAY_ENV === 'production' && !signature) {
      console.warn('⚠ No signature in production mode - consider enabling signature verification')
    }

    // Извлечение данных из payload
    // Яндекс Pay может отправлять данные в разных форматах
    // Согласно документации Merchant API, структура может быть:
    // - { event: 'payment.succeeded', orderId: '...', ... }
    // - { type: 'payment.succeeded', order: { id: '...' }, ... }
    // - { status: 'succeeded', order_id: '...', ... }

    const event = payload?.event || payload?.type || payload?.status
    const orderId = payload?.orderId || payload?.order_id || payload?.order?.id || payload?.orderId
    const paymentId = payload?.paymentId || payload?.payment_id || payload?.id || payload?.payment?.id
    const status = payload?.status || payload?.paymentStatus || payload?.payment?.status

    // Дополнительные поля из документации Merchant API
    const amount = payload?.amount?.value || payload?.amount || payload?.payment?.amount?.value
    const currency = payload?.amount?.currency || payload?.currency || payload?.payment?.amount?.currency || 'RUB'

    console.log('Extracted data:')
    console.log('  Event:', event)
    console.log('  Order ID:', orderId)
    console.log('  Payment ID:', paymentId)
    console.log('  Status:', status)
    console.log('  Amount:', amount)
    console.log('  Currency:', currency)

    // Логируем событие
    try {
      const { error: logError } = await supabase.from('payment_logs').insert({
        provider: 'yandex_pay',
        event: event || status || 'unknown',
        order_id: String(orderId || ''),
        payment_id: String(paymentId || ''),
        payload: payload,
      })
      if (logError) {
        console.error('Error inserting Yandex Pay payment log:', logError)
      } else {
        console.log('✓ Payment event logged')
      }
    } catch (e) {
      console.error('Failed to log Yandex Pay payment event:', e)
    }

    if (!orderId) {
      console.warn('Yandex Pay callback: No order ID in payload')
      // Возвращаем успех, чтобы Яндекс Pay не повторял запрос
      return NextResponse.json({ ok: true, message: 'No order ID, but callback processed' })
    }

    // Маппинг статусов Яндекс Pay на внутренние статусы
    // Согласно документации Merchant API:
    // - payment.succeeded / succeeded → paid
    // - payment.canceled / canceled → cancelled
    // - payment.refunded / refunded → refunded
    let newOrderStatus: string | null = null

    const eventLower = String(event || '').toLowerCase()
    const statusLower = String(status || '').toLowerCase()

    if (
      eventLower === 'payment.succeeded' ||
      eventLower === 'payment_succeeded' ||
      statusLower === 'succeeded' ||
      statusLower === 'paid' ||
      statusLower === 'success' ||
      statusLower === 'completed'
    ) {
      newOrderStatus = 'paid'
    } else if (
      eventLower === 'payment.canceled' ||
      eventLower === 'payment_canceled' ||
      eventLower === 'payment.cancelled' ||
      statusLower === 'canceled' ||
      statusLower === 'cancelled' ||
      statusLower === 'failed' ||
      statusLower === 'declined'
    ) {
      newOrderStatus = 'cancelled'
    } else if (
      eventLower === 'payment.refunded' ||
      eventLower === 'payment_refunded' ||
      statusLower === 'refunded'
    ) {
      newOrderStatus = 'refunded'
    }

    if (newOrderStatus) {
      const updateData: any = {
        status: newOrderStatus,
        payment: {
          method: 'yandex_pay',
          status: newOrderStatus,
          paymentId: paymentId,
          provider: 'yandex_pay',
        },
      }

      // Добавляем информацию о сумме, если есть
      if (amount) {
        updateData.payment.amount = amount
        updateData.payment.currency = currency || 'RUB'
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .or(`order_number.eq.${orderId}`)
        .select()

      if (error) {
        console.error('Error updating order status for Yandex Pay callback:', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      }

      console.log(`✓ Order ${orderId} status updated to ${newOrderStatus} by Yandex Pay callback`)
      if (data && data.length > 0) {
        console.log('Updated order:', data[0])
      }
    } else {
      console.log(`⚠ Yandex Pay callback: Unknown status "${status || event}", skipping update`)
      console.log('Full payload structure:', Object.keys(payload))
    }

    // Всегда возвращаем успех, чтобы Яндекс Pay не повторял запрос
    // (даже если статус неизвестен, мы его залогировали)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Yandex Pay callback error:', e)
    console.error('Error stack:', e?.stack)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
