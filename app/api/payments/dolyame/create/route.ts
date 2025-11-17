export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import https from 'https'
import fs from 'fs'
import path from 'path'

/**
 * Создание заявки на оплату частями через Долями API
 * Документация: https://dolyame.ru/develop/api/
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('=== Долями Create Order - Incoming Request ===')
    console.log('Body:', JSON.stringify(body, null, 2))
    
    // Читаем учетные данные из env
    const login = process.env.DOLYAME_LOGIN
    const password = process.env.DOLYAME_PASSWORD
    const apiUrl = process.env.DOLYAME_API_URL || 'https://partner.dolyame.ru/v1/orders'
    
    if (!login || !password) {
      console.error('Долями credentials missing!')
      return NextResponse.json(
        { ok: false, error: 'Долями credentials not configured' },
        { status: 500 }
      )
    }

    const amount = Number(body?.amount || 0)
    const orderId = body?.orderId || body?.order_id
    const items = body?.items || []
    const customer = body?.customer || {}

    console.log('Parsed values:', { amount, orderId, itemsCount: items.length })

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      return NextResponse.json(
        { ok: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!orderId) {
      console.error('Order ID missing!')
      return NextResponse.json(
        { ok: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Формируем данные для создания заявки в Долями
    // Согласно документации Долями, заявка должна содержать:
    // - order_id: уникальный идентификатор заказа
    // - amount: сумма заказа в рублях (число с двумя знаками после запятой)
    // - items: массив товаров
    // - customer: данные клиента (опционально)
    const orderData: any = {
      order_id: String(orderId),
      amount: amount.toFixed(2),
      items: items.map((item: any) => ({
        name: item.name || 'Товар',
        price: Number(item.price || 0).toFixed(2),
        quantity: Number(item.qty || 1),
        sku: String(item.id || ''),
      })),
    }

    // Добавляем данные клиента, если они есть
    if (customer.name) {
      orderData.customer = {
        first_name: customer.name.split(' ')[0] || customer.name,
        last_name: customer.name.split(' ').slice(1).join(' ') || '',
        phone: customer.phone ? customer.phone.replace(/\D/g, '') : undefined,
        email: customer.email || undefined,
      }
    }

    // Формируем callback URL для уведомлений
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    orderData.callback_url = `${baseUrl}/api/payments/dolyame/callback`

    console.log('=== Долями Order Request ===')
    console.log('URL:', apiUrl)
    console.log('Order data:', JSON.stringify(orderData, null, 2))

    // Для работы с Долями API требуется mTLS сертификат
    // Пути к сертификатам должны быть указаны в env переменных
    const certPath = process.env.DOLYAME_CERT_PATH
    const keyPath = process.env.DOLYAME_KEY_PATH
    const caPath = process.env.DOLYAME_CA_PATH

    // Настройка HTTPS агента с mTLS сертификатами
    let httpsAgent: https.Agent | undefined
    if (certPath && keyPath) {
      try {
        const cert = fs.readFileSync(certPath)
        const key = fs.readFileSync(keyPath)
        const ca = caPath ? fs.readFileSync(caPath) : undefined

        httpsAgent = new https.Agent({
          cert,
          key,
          ca,
          rejectUnauthorized: true,
        })
        console.log('mTLS certificates loaded successfully')
      } catch (certError: any) {
        console.error('Error loading mTLS certificates:', certError.message)
        return NextResponse.json(
          { ok: false, error: 'Failed to load mTLS certificates' },
          { status: 500 }
        )
      }
    } else {
      console.warn('=== mTLS certificates not configured ===')
      console.warn('Using default HTTPS agent (request may fail without mTLS)')
      console.warn('For production, you need to configure mTLS certificates')
    }

    // Отправляем запрос в Долями API
    const auth = Buffer.from(`${login}:${password}`).toString('base64')
    
    // Настройка fetch с поддержкой mTLS
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    }
    
    // Если есть httpsAgent, используем его (для mTLS)
    // В Node.js 18+ fetch не поддерживает agent напрямую, поэтому используем https модуль
    let response: Response
    if (httpsAgent) {
      // Используем https модуль напрямую для mTLS (уже импортирован в начале файла)
      const url = new URL(apiUrl)
      
      const httpsOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        agent: httpsAgent,
      }
      
      response = await new Promise((resolve, reject) => {
        const req = https.request(httpsOptions, (res: any) => {
          let data = ''
          res.on('data', (chunk: Buffer) => { data += chunk })
          res.on('end', () => {
            resolve(new Response(data, {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
            }))
          })
        })
        req.on('error', reject)
        req.write(JSON.stringify(orderData))
        req.end()
      })
    } else {
      // Обычный fetch без mTLS (для тестирования или если сертификаты не настроены)
      response = await fetch(apiUrl, fetchOptions)
    }

    const contentType = response.headers.get('content-type') || ''
    let responseData: any

    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      const text = await response.text()
      console.error(`Долями API returned non-JSON response (${response.status}):`, text)
      throw new Error(`Долями API returned non-JSON response: ${text.substring(0, 100)}`)
    }

    console.log('=== Долями Order Response ===')
    console.log('Status:', response.status, response.statusText)
    console.log('Response:', JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error('=== Долями API Error ===')
      console.error('Status:', response.status, response.statusText)
      console.error('Response:', JSON.stringify(responseData, null, 2))
      
      // Если ошибка связана с сертификатом или SSL
      if (response.status === 403 || response.status === 401 || response.status === 0) {
        console.error('=== Возможная проблема с mTLS сертификатом ===')
        console.error('Убедитесь, что сертификаты настроены правильно')
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: responseData?.message || responseData?.error || `Долями API error (${response.status})`,
          details: responseData,
          hint: !certPath || !keyPath ? 'mTLS сертификаты не настроены. Для работы с API Долями требуется mTLS сертификат.' : undefined,
        },
        { status: response.status || 500 }
      )
    }

    // Долями возвращает URL для редиректа пользователя на страницу оплаты
    return NextResponse.json({
      ok: true,
      paymentUrl: responseData.payment_url || responseData.url,
      orderId: responseData.order_id || orderId,
      status: responseData.status,
    })
  } catch (e: any) {
    console.error('Долями create order error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

