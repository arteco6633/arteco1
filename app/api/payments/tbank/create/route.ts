export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Создание платежа через T-Bank API
 * Документация: https://developer.tbank.ru/eacq/intro
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('=== T-Bank Create Payment - Incoming Request ===')
    console.log('Body:', JSON.stringify(body, null, 2))
    
    // Читаем значения из env
    // ВАЖНО: НЕ делаем trim() для пароля - он должен быть как есть из env
    let terminalId = process.env.TBANK_TERMINAL_ID
    let password = process.env.TBANK_PASSWORD
    
    // Очищаем только от переносов строк и табуляций (но НЕ от пробелов!)
    if (terminalId) {
      terminalId = terminalId.replace(/[\r\n\t]/g, '')
    }
    if (password) {
      // Убираем только переносы строк и табуляции, но НЕ пробелы и НЕ trim!
      password = password.replace(/[\r\n\t]/g, '')
    }
    
    // Детальная проверка значений из env
    console.log('=== Environment Variables Check ===')
    console.log('TBANK_TERMINAL_ID:', {
      value: terminalId,
      length: terminalId?.length,
      bytes: terminalId ? Buffer.from(terminalId, 'utf8').length : 0,
      hasSpaces: terminalId?.includes(' '),
      hasNewlines: terminalId?.includes('\n'),
      hasTabs: terminalId?.includes('\t'),
      charCodes: terminalId ? Array.from(terminalId).map(c => c.charCodeAt(0)) : [],
    })
    // Безопасность: не логируем пароль даже в маскированном виде в production
    if (process.env.NODE_ENV === 'development') {
      console.log('TBANK_PASSWORD (DEV ONLY):', {
        length: password?.length,
        bytes: password ? Buffer.from(password, 'utf8').length : 0,
        hasSpaces: password?.includes(' '),
        hasNewlines: password?.includes('\n'),
        hasTabs: password?.includes('\t'),
        firstChar: password ? password.charCodeAt(0) : null,
        lastChar: password ? password.charCodeAt(password.length - 1) : null,
      })
    }
    
    // API endpoint для T-Bank согласно документации:
    // Документация: https://developer.tbank.ru/eacq/intro/errors/test-cases
    // Боевая среда (production): https://securepay.tinkoff.ru/v2/Init
    // Тестовая среда: https://rest-api-test.tinkoff.ru/v2/Init (требует добавления IP в белый список)
    
    // По умолчанию используем PRODUCTION URL для всех терминалов
    let apiUrl = 'https://securepay.tinkoff.ru/v2/Init'
    
    // Если явно указан другой URL, используем его
    if (process.env.TBANK_API_URL) {
      apiUrl = process.env.TBANK_API_URL
      if (!apiUrl.endsWith('/Init')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/Init'
      }
    }
    
    const isDemoTerminal = terminalId?.includes('DEMO')
    console.log('Using API URL:', apiUrl, isDemoTerminal ? '(DEMO terminal -> PRODUCTION URL as per docs)' : '(PRODUCTION terminal)')

    console.log('Environment check:', {
      hasTerminalId: !!terminalId,
      hasPassword: !!password,
      terminalId: terminalId?.substring(0, 10) + '...',
      apiUrl,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    })

    if (!terminalId || !password) {
      console.error('=== T-Bank credentials missing! ===')
      console.error('TBANK_TERMINAL_ID:', terminalId ? 'present' : 'MISSING')
      console.error('TBANK_PASSWORD:', password ? 'present' : 'MISSING')
      return NextResponse.json(
        { ok: false, error: 'T-Bank credentials not configured. Проверьте переменные окружения TBANK_TERMINAL_ID и TBANK_PASSWORD' },
        { status: 500 }
      )
    }
    
    // Проверка формата terminalId для реального терминала
    if (!terminalId.includes('DEMO') && terminalId.length < 10) {
      console.warn('=== Warning: Terminal ID seems too short for production ===')
      console.warn('Terminal ID length:', terminalId.length)
      console.warn('Terminal ID:', terminalId.substring(0, 10) + '...')
    }

    const amount = Number(body?.amount || 0)
    const orderId = body?.orderId || body?.order_id

    console.log('Parsed values:', { amount, orderId, amountInKopecks: Math.round(amount * 100) })

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

    // Формируем данные для Init запроса
    // Сумма в копейках
    const amountInKopecks = Math.round(amount * 100)

    // Формируем базовые данные для Init запроса
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    
    // Формируем данные для Init запроса
    // ВАЖНО: Description передается как есть, со всеми пробелами (без trim)
    const description = body?.description || `Заказ #${orderId}`
    
    // Формируем данные для Init запроса
    // Согласно документации, Amount должен быть числом, OrderId - строкой
    // ВАЖНО: baseUrl должен указывать на реальный домен для production (не localhost)
    const initData: any = {
      TerminalKey: terminalId,
      Amount: amountInKopecks, // Число в копейках
      OrderId: String(orderId), // Строка
      Description: description, // Строка со всеми пробелами
      SuccessURL: body?.successUrl || `${baseUrl}/order/success?order=${orderId}`,
      FailURL: body?.failUrl || `${baseUrl}/order/fail?order=${orderId}`,
      NotificationURL: `${baseUrl}/api/payments/tbank/callback`,
    }
    
    console.log('=== URL Configuration ===')
    console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
    console.log('baseUrl:', baseUrl)
    console.log('NotificationURL:', initData.NotificationURL)
    
    // Дополнительная проверка для DEMO терминала
    console.log('=== DEMO Terminal Check ===')
    console.log('TerminalKey matches DEMO:', terminalId.includes('DEMO'))
    console.log('Using API URL:', apiUrl)
    console.log('Init data types:', {
      TerminalKey: typeof initData.TerminalKey,
      Amount: typeof initData.Amount,
      OrderId: typeof initData.OrderId,
      Description: typeof initData.Description,
    })

    // Добавляем DATA только если есть email или phone
    if (body?.email || body?.phone) {
      initData.DATA = {}
      if (body?.email) initData.DATA.Email = body.email
      if (body?.phone) initData.DATA.Phone = body.phone
    }

    // Receipt обязателен для реального терминала (не DEMO)
    // Согласно документации T-Bank, для production терминала Receipt обязателен
    if (!terminalId.includes('DEMO')) {
      // Формируем Receipt для реального терминала
      // ВАЖНО: Email или Phone обязательны для Receipt
      const receiptEmail = body?.email || null
      const receiptPhone = body?.phone ? body.phone.replace(/\D/g, '').replace(/^8/, '7') : null
      
      if (!receiptEmail && !receiptPhone) {
        console.warn('=== Warning: No email or phone for Receipt ===')
        console.warn('Receipt requires Email or Phone. Using phone from contact if available.')
      }
      
      const receipt: any = {
        Taxation: 'usn_income', // Упрощенная система налогообложения (доходы)
        Items: [],
      }
      
      // Email или Phone обязательны для Receipt
      if (receiptEmail) receipt.Email = receiptEmail
      if (receiptPhone) receipt.Phone = receiptPhone
      
      // Если есть данные о товарах, добавляем их в чек
      if (body?.items && Array.isArray(body.items) && body.items.length > 0) {
        receipt.Items = body.items.map((item: any) => ({
          Name: String(item.name || 'Товар').substring(0, 128), // Максимум 128 символов
          Price: Math.round((item.price || 0) * 100), // Цена в копейках
          Quantity: Math.max(1, Math.round(item.qty || 1)), // Количество (минимум 1)
          Amount: Math.round((item.price || 0) * (item.qty || 1) * 100), // Сумма в копейках
          Tax: 'none', // Без НДС (для УСН доходы)
        }))
        
        // Проверяем, что сумма Items совпадает с общей суммой
        const itemsTotal = receipt.Items.reduce((sum: number, item: any) => sum + item.Amount, 0)
        if (itemsTotal !== amountInKopecks) {
          console.warn('=== Warning: Items total does not match order total ===')
          console.warn('Items total:', itemsTotal, 'Order total:', amountInKopecks)
          // Корректируем последний товар, чтобы сумма совпадала
          if (receipt.Items.length > 0) {
            const diff = amountInKopecks - itemsTotal
            receipt.Items[receipt.Items.length - 1].Amount += diff
            receipt.Items[receipt.Items.length - 1].Price = Math.round(receipt.Items[receipt.Items.length - 1].Amount / receipt.Items[receipt.Items.length - 1].Quantity)
          }
        }
      } else {
        // Если товары не переданы, создаем один товар на всю сумму
        receipt.Items = [{
          Name: String(description || 'Заказ').substring(0, 128),
          Price: amountInKopecks,
          Quantity: 1,
          Amount: amountInKopecks,
          Tax: 'none',
        }]
      }
      
      initData.Receipt = receipt
      console.log('=== Receipt for Production Terminal ===')
      console.log('Receipt:', JSON.stringify(receipt, null, 2))
      console.log('Receipt Items count:', receipt.Items.length)
      console.log('Receipt Items total:', receipt.Items.reduce((sum: number, item: any) => sum + item.Amount, 0))
    } else if (body?.receipt) {
      // Для DEMO терминала Receipt опционален, но если передан - используем
      initData.Receipt = body.receipt
    }

    // Формируем строку для подписи согласно документации T-Bank
    // Документация: https://developer.tbank.ru/eacq/intro/developer/token
    // ВАЖНО: Согласно ответу поддержки: "Для метода Init в формировании подписи запроса участвуют 
    // ВСЕ корневые объекты, переданные в запросе, и исключаются объекты Receipt и DATA."
    // Это означает, что SuccessURL, FailURL, NotificationURL ДОЛЖНЫ участвовать в подписи!
    // Алгоритм:
    // 1. Собрать массив параметров корневого объекта (исключаем только вложенные объекты: Receipt, DATA)
    // 2. Исключаем из подписи: Token (это сам токен, его не подписываем)
    // 3. Добавить Password в массив параметров
    // 4. Отсортировать массив по алфавиту по ключу
    // 5. Конкатенировать только значения в строку
    // 6. Применить SHA-256 (с поддержкой UTF-8)
    
    // Создаем копию initData без полей, которые не входят в подпись
    // ВАЖНО: Исключаем ТОЛЬКО Token, Receipt и DATA. Все остальные корневые поля участвуют!
    const signData: Record<string, any> = { ...initData }
    delete signData.Token   // Токен не участвует в подписи (это сам токен)
    delete signData.Receipt // Вложенный объект не участвует
    delete signData.DATA    // Вложенный объект не участвует
    
    console.log('=== Fields for Signature ===')
    console.log('All initData fields:', Object.keys(initData))
    console.log('Fields excluded from signature:', ['Token', 'Receipt', 'DATA'])
    console.log('Fields included in signature:', Object.keys(signData))
    console.log('NOTE: SuccessURL, FailURL, NotificationURL ARE included as per support response!')
    
    // Преобразуем все значения в строки согласно документации T-Bank
    // ВАЖНО: В документации показано, что Amount в подписи - это СТРОКА "19200", а не число!
    // Все значения должны быть строками БЕЗ trim
    // Description передается со всеми пробелами
    const signFields: Record<string, string> = {}
    for (const key in signData) {
      const value = signData[key]
      if (value !== null && value !== undefined) {
        // Все значения преобразуем в строки БЕЗ trim
        // Согласно документации, значения должны быть как есть
        // Amount должен быть строкой (в документации: {"Amount": "19200"})
        signFields[key] = String(value)
      }
    }
    
    // Добавляем Password в массив параметров (ВАЖНО: Password включается в сортировку!)
    // Password должен быть строкой БЕЗ trim
    const passwordStr = String(password)
    signFields.Password = passwordStr
    
    // Сортируем ключи по алфавиту и формируем строку из значений
    const sortedKeys = Object.keys(signFields).sort()
    const signString = sortedKeys.map(key => signFields[key]).join('')
    
    // Безопасность: debug логи только в development режиме и без чувствительных данных
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Signature Debug (DEV ONLY) ===')
      console.log('Sign fields order (alphabetical):', sortedKeys)
      console.log('Sign string length:', signString.length)
      console.log('Terminal ID:', terminalId)
      // НЕ логируем пароль даже в development
    }
    console.log('Original initData (for reference):', JSON.stringify({
      TerminalKey: initData.TerminalKey,
      Amount: initData.Amount,
      OrderId: initData.OrderId,
      Description: initData.Description,
    }, null, 2))
    
    // Тестовая проверка: создаем подпись по примеру из документации
    // Пример из документации: Amount=19200, Description="Подарочная карта на 1000 рублей", OrderId="00000", Password="11111111111111", TerminalKey="MerchantTerminalKey"
    // Ожидаемая строка: "19200Подарочная карта на 1000 рублей0000011111111111111MerchantTerminalKey"
    // Ожидаемый токен: "72dd466f8ace0a37a1f740ce5fb78101712bc0665d91a8108c7c8a0ccd426db2"
    const testFields = {
      Amount: '19200',
      Description: 'Подарочная карта на 1000 рублей',
      OrderId: '00000',
      Password: '11111111111111',
      TerminalKey: 'MerchantTerminalKey',
    }
    const testSortedKeys = Object.keys(testFields).sort()
    const testSignString = testSortedKeys.map(key => testFields[key as keyof typeof testFields]).join('')
    const testToken = crypto.createHash('sha256').update(testSignString).digest('hex')
    console.log('=== Test Signature (from documentation example) ===')
    console.log('Test sign string:', testSignString)
    console.log('Test token:', testToken)
    console.log('Expected token:', '72dd466f8ace0a37a1f740ce5fb78101712bc0665d91a8108c7c8a0ccd426db2')
    console.log('Test token matches:', testToken === '72dd466f8ace0a37a1f740ce5fb78101712bc0665d91a8108c7c8a0ccd426db2')

    // Создаем подпись (SHA-256)
    const token = crypto.createHash('sha256').update(signString).digest('hex')

    const requestPayload = {
      ...initData,
      Token: token,
    }

    // Безопасность: логируем только в development и без чувствительных данных
    if (process.env.NODE_ENV === 'development') {
      console.log('=== T-Bank Init Request (DEV ONLY) ===')
      console.log('URL:', apiUrl)
      // Не логируем полный payload и токен в production
      console.log('Request payload (sanitized):', JSON.stringify({
        ...requestPayload,
        Token: '***REDACTED***'
      }, null, 2))
    }

    // Отправляем запрос в T-Bank API
    // ВАЖНО: Для тестового API (rest-api-test.tinkoff.ru) ваш IP должен быть в белом списке!
    // Чтобы добавить IP в белый список, отправьте запрос в T-Bank:
    // - Email: acq_help@tbank.ru
    // - Укажите: ИНН, наименование организации, IP-адрес, URL (rest-api-test.tinkoff.ru)
    console.log('=== Request Info ===')
    console.log('API URL:', apiUrl)
    console.log('NOTE: For test API, your IP must be whitelisted!')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    // Проверяем Content-Type перед парсингом JSON
    const contentType = response.headers.get('content-type') || ''
    let responseData: any
    
    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      // Если ответ не JSON, читаем как текст для отладки
      const textResponse = await response.text()
      console.error('T-Bank returned non-JSON response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: textResponse.substring(0, 500), // Первые 500 символов
      })
      throw new Error(`T-Bank API returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}`)
    }

    console.log('=== T-Bank Init Response ===')
    console.log('Status:', response.status, response.statusText)
    console.log('Response:', JSON.stringify(responseData, null, 2))

    if (!response.ok || responseData.ErrorCode !== '0') {
      console.error('T-Bank Init error:', {
        status: response.status,
        statusText: response.statusText,
        errorCode: responseData.ErrorCode,
        message: responseData.Message,
        details: responseData.Details,
        fullResponse: responseData,
      })
      // Логируем полную информацию об ошибке
      console.error('=== T-Bank API Error Details ===')
      console.error('ErrorCode:', responseData.ErrorCode)
      console.error('Message:', responseData.Message)
      console.error('Details:', responseData.Details)
      console.error('Full response:', JSON.stringify(responseData, null, 2))
      
      return NextResponse.json(
        {
          ok: false,
          error: responseData.Message || responseData.Details || 'T-Bank API error',
          errorCode: responseData.ErrorCode,
          details: responseData.Details,
        },
        { status: response.ok ? 400 : 500 }
      )
    }

    // Возвращаем PaymentURL для редиректа пользователя
    return NextResponse.json({
      ok: true,
      paymentUrl: responseData.PaymentURL,
      paymentId: responseData.PaymentId,
      orderId: responseData.OrderId,
    })
  } catch (e: any) {
    console.error('T-Bank create payment error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



