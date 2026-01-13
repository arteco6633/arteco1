"use client"

import Link from 'next/link'
import { useCart } from '@/components/CartContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductGrid from '@/components/ProductGrid'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    PaymentIntegration?: any
  }
}

export default function CartPage() {
  const { items, total, updateQty, remove, clear, add } = useCart()
  const router = useRouter()
  const { data: session } = useSession()
  const [suggested, setSuggested] = useState<Array<{id:number; name:string; price:number; image_url:string}>>([])
  const [suggestedOpen, setSuggestedOpen] = useState(false)
  const [acceptAll, setAcceptAll] = useState(false)
  const [consents, setConsents] = useState({ privacy: false, marketing: false, calls: false })
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [userProfile, setUserProfile] = useState<{ name: string | null; phone: string | null } | null>(null)
  const profileLoadedRef = useRef<string | null>(null)
  const [deliveryType, setDeliveryType] = useState<'courier'|'pickup'>('courier')
  const [address, setAddress] = useState('')
  const [needAssembly, setNeedAssembly] = useState(false)
  const [needUtilization, setNeedUtilization] = useState(false)
  const [addrQuery, setAddrQuery] = useState('')
  const [addrSuggests, setAddrSuggests] = useState<string[]>([])
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('cod')
  const [ypLoading, setYpLoading] = useState(false)

  // Альтернативная загрузка SDK динамически (если основной способ не сработал)
  function loadYandexPaySdkDynamically(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Проверяем, если SDK уже загружен
      if (typeof window !== 'undefined' && (window as any).YaPay) {
        console.log('✓ Yandex Pay SDK already available (dynamic check)')
        return resolve()
      }

      // Проверяем, не загружается ли уже скрипт
      const existingScript = document.querySelector('script[src*="pay.yandex.ru/sdk"]') as HTMLScriptElement | null
      if (existingScript) {
        console.log('SDK script already in DOM, checking status...')
        console.log('Script src:', existingScript.src)
        console.log('Script element:', existingScript)
        
        // Проверяем, есть ли обработчики событий
        const hasOnLoad = existingScript.onload !== null
        const hasOnError = existingScript.onerror !== null
        console.log('Script has onload handler:', hasOnLoad)
        console.log('Script has onerror handler:', hasOnError)
        
        // Если скрипт уже в DOM, но объект не появился - это проблема
        console.warn('⚠️ Script exists in DOM but YaPay object not found')
        console.warn('This usually means:')
        console.warn('1. Script failed to execute (CORS, domain whitelist, etc.)')
        console.warn('2. Script executed but YaPay object was not created')
        console.warn('3. Check Network tab for errors loading:', existingScript.src)
        console.warn('4. Check Console tab for JavaScript errors')
        
        // Ждём загрузки существующего скрипта с более длинными задержками
        const delays = [500, 1000, 2000, 3000, 5000]
        let attempt = 0
        
        const checkInterval = setInterval(() => {
          if (typeof window !== 'undefined' && (window as any).YaPay) {
            clearInterval(checkInterval)
            clearTimeout(timeout)
            console.log('✓ SDK loaded from existing script')
            resolve()
            return
          }
          
          attempt++
          if (attempt >= delays.length) {
            clearInterval(checkInterval)
            clearTimeout(timeout)
            console.error('✗ Script exists but YaPay object never appeared')
            console.error('Please check:')
            console.error('1. Network tab - status of', existingScript.src)
            console.error('2. Console for JavaScript errors')
            console.error('3. Yandex Pay console - domain whitelist settings')
            reject(new Error('SDK script exists but YaPay object not found - check Network tab and domain whitelist'))
          }
        }, delays[attempt] || 200)
        
        const timeout = setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('SDK script exists but YaPay object not found - timeout'))
        }, 15000)
        
        return
      }

      // Создаём новый script элемент
      const script = document.createElement('script')
      script.src = 'https://pay.yandex.ru/sdk/v2/pay.js'
      script.async = true
      script.defer = true

      script.onload = () => {
        // Проверяем доступность SDK с задержками
        const delays = [100, 300, 500, 1000, 2000]
        let attempt = 0

        const checkWithDelay = () => {
          if (typeof window !== 'undefined' && (window as any).YaPay) {
            console.log('✓ Yandex Pay SDK loaded dynamically')
            window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
            resolve()
            return
          }

          attempt++
          if (attempt < delays.length) {
            setTimeout(checkWithDelay, delays[attempt] - (delays[attempt - 1] || 0))
          } else {
            reject(new Error('SDK script loaded but YaPay object not found'))
          }
        }

        setTimeout(checkWithDelay, delays[0])
      }

      script.onerror = (error) => {
        console.error('Failed to load SDK dynamically:', error)
        reject(new Error('Failed to load SDK script'))
      }

      document.head.appendChild(script)

      // Таймаут на случай, если события не сработают
      const timeout = setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).YaPay) {
          resolve()
        } else {
          reject(new Error('SDK load timeout'))
        }
      }, 15000)
    })
  }

  // Проверка доступности Яндекс Pay SDK (загружается через Next.js Script в layout)
  function waitForYandexPaySdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Проверяем, если SDK уже загружен
      if (typeof window !== 'undefined' && (window as any).YaPay) {
        console.log('✓ Yandex Pay SDK already available')
        return resolve()
      }

      let resolved = false
      const SDK_URL = 'https://pay.yandex.ru/sdk/v2/pay.js'

      // Слушаем событие загрузки SDK
      const onSdkLoaded = () => {
        if (resolved) return
        if (typeof window !== 'undefined' && (window as any).YaPay) {
          resolved = true
          clearTimeout(timeout)
          clearInterval(checkInterval)
          window.removeEventListener('yandex-pay-sdk-loaded', onSdkLoaded)
          window.removeEventListener('yandex-pay-sdk-error', onSdkError)
          console.log('✓ Yandex Pay SDK loaded via event')
          resolve()
        }
      }

      // Слушаем событие об ошибке загрузки SDK
      const onSdkError = (event: any) => {
        if (resolved) return
        resolved = true
        clearTimeout(timeout)
        clearInterval(checkInterval)
        window.removeEventListener('yandex-pay-sdk-loaded', onSdkLoaded)
        window.removeEventListener('yandex-pay-sdk-error', onSdkError)
        
        const errorDetail = event.detail || {}
        console.error('✗ Yandex Pay SDK error event received:', errorDetail)
        
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        
        if (isLocalhost) {
          reject(new Error('⚠️ Яндекс Pay SDK требует HTTPS!\n\nНа localhost (HTTP) SDK не может загрузиться из-за CORS.\n\nРешения:\n1. Используйте ngrok для создания HTTPS туннеля\n2. Тестируйте на production домене (после деплоя)\n3. SDK будет работать на HTTPS домене\n\nЭто нормальное поведение - SDK требует безопасное соединение.'))
        } else {
          reject(new Error(`Ошибка загрузки Яндекс Pay SDK.\n\nSDK URL: ${SDK_URL}\n\nВозможные причины:\n1. Проблемы с интернет-соединением\n2. Блокировка скрипта антивирусом/расширениями браузера\n3. Проблемы на стороне сервера Яндекс Pay\n4. CORS ошибки (проверьте настройки домена в консоли Яндекс Pay)\n\nПроверьте:\n- Вкладку Network в DevTools, загружается ли ${SDK_URL}\n- Консоль браузера (F12) для подробностей\n- Настройки домена в консоли Яндекс Pay`))
        }
      }

      window.addEventListener('yandex-pay-sdk-loaded', onSdkLoaded)
      window.addEventListener('yandex-pay-sdk-error', onSdkError)

      // Ждём загрузки SDK (максимум 20 секунд для прода)
      const timeout = setTimeout(() => {
        if (resolved) return
        resolved = true
        window.removeEventListener('yandex-pay-sdk-loaded', onSdkLoaded)
        window.removeEventListener('yandex-pay-sdk-error', onSdkError)
        clearInterval(checkInterval)
        
        // Последняя проверка перед ошибкой
        if (typeof window !== 'undefined' && (window as any).YaPay) {
          console.log('✓ Yandex Pay SDK found on final check')
          resolve()
        } else {
          const isLocalhost = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          
          // Проверяем, загрузился ли скрипт в DOM
          const scripts = document.querySelectorAll('script[src*="pay.yandex.ru"]')
          console.warn('SDK timeout - scripts found in DOM:', scripts.length)
          
          if (isLocalhost) {
            reject(new Error('⚠️ Яндекс Pay SDK требует HTTPS!\n\nНа localhost (HTTP) SDK не может загрузиться из-за CORS.\n\nРешения:\n1. Используйте ngrok для создания HTTPS туннеля\n2. Тестируйте на production домене (после деплоя)\n3. SDK будет работать на HTTPS домене\n\nЭто нормальное поведение - SDK требует безопасное соединение.'))
          } else {
            reject(new Error(`SDK load timeout: Яндекс Pay SDK не загрузился за 20 секунд.\n\nSDK URL: ${SDK_URL}\n\nВозможные причины:\n1. Проблемы с интернет-соединением\n2. Блокировка скрипта антивирусом/расширениями браузера\n3. Проблемы на стороне сервера Яндекс Pay\n4. CORS ошибки (проверьте настройки домена в консоли Яндекс Pay)\n\nПроверьте:\n- Вкладку Network в DevTools, загружается ли ${SDK_URL}\n- Консоль браузера (F12) для подробностей\n- Настройки домена в консоли Яндекс Pay`))
          }
        }
      }, 20000)

      // Проверяем каждые 200мс (более частое обновление)
      const checkInterval = setInterval(() => {
        if (resolved) {
          clearInterval(checkInterval)
          return
        }
        if (typeof window !== 'undefined' && (window as any).YaPay) {
          resolved = true
          clearInterval(checkInterval)
          clearTimeout(timeout)
          window.removeEventListener('yandex-pay-sdk-loaded', onSdkLoaded)
          window.removeEventListener('yandex-pay-sdk-error', onSdkError)
          console.log('✓ Yandex Pay SDK is now available')
          resolve()
        }
      }, 200)
    })
  }
  const [placing, setPlacing] = useState(false)
  const [errors, setErrors] = useState<{name?: boolean; phone?: boolean; privacy?: boolean; delivery?: boolean}>({})
  const [showFillModal, setShowFillModal] = useState(false)
  const [moduleImages, setModuleImages] = useState<Record<number, string>>({})
  const [productSpecs, setProductSpecs] = useState<Record<number, { width?: string; height?: string; depth?: string; color?: string }>>({})
  const [productColors, setProductColors] = useState<Record<number, string[]>>({})

  function toggleAcceptAll() {
    const next = !acceptAll
    setAcceptAll(next)
    setConsents({ privacy: next, marketing: next, calls: next })
  }

  // Адрес: дебаунс‑подсказки (Яндекс Геокодер)
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_YANDEX_API_KEY
    if (!addrQuery || addrQuery.length < 3 || !token) {
      setAddrSuggests([])
      return
    }
    setAddrLoading(true)
    const id = setTimeout(async () => {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(token as string)}&format=json&geocode=${encodeURIComponent(addrQuery)}&lang=ru_RU&results=7`
        const resp = await fetch(url)
        if (!resp.ok) throw new Error('suggest error')
        const data = await resp.json()
        const members = data?.response?.GeoObjectCollection?.featureMember || []
        const list = members.map((m: any) => {
          const g = m?.GeoObject
          const name = g?.name || ''
          const desc = g?.description || ''
          return [desc, name].filter(Boolean).join(', ')
        }).filter((s: string) => !!s)
        setAddrSuggests(list)
        setAddrOpen(true)
      } catch (e) {
        setAddrSuggests([])
      } finally {
        setAddrLoading(false)
      }
    }, 300)
    return () => clearTimeout(id)
  }, [addrQuery])

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const productIds = Array.from(new Set(items.map(i => i.id)))
        if (productIds.length === 0) { setSuggested([]); return }
        // 1) Получаем related_products для товаров в корзине
        const { data: rel, error } = await supabase
          .from('products')
          .select('id, related_products')
          .in('id', productIds)
        if (error) throw error
        const ids = Array.from(new Set((rel||[]).flatMap((r: any) => (r as any).related_products || [])))
        if (ids.length === 0) { setSuggested([]); return }
        // 2) Загружаем сами товары
        const { data: prods, error: err2 } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', ids)
          .limit(20)
        if (err2) throw err2
        setSuggested((prods as any) || [])
      } catch (e) {
        console.error('suggestions load error', e)
      }
    }
    loadSuggestions()
  }, [items])

  // Загружаем характеристики товаров из корзины
  useEffect(() => {
    async function loadProductSpecs() {
      try {
        const productIds = Array.from(new Set(items.map(i => i.id)))
        if (productIds.length === 0) { setProductSpecs({}); return }
        
        const { data: products, error } = await supabase
          .from('products')
          .select('id, specs, colors')
          .in('id', productIds)
        
        if (error) throw error
        
        const specsMap: Record<number, { width?: string; height?: string; depth?: string; color?: string }> = {}
        const colorsMap: Record<number, string[]> = {}
        
        products?.forEach((p: any) => {
          const specs: any = {}
          
          // Ищем width, height, depth в specs.custom
          if (p.specs?.custom && Array.isArray(p.specs.custom)) {
            p.specs.custom.forEach((item: { label?: string; value?: string }) => {
              const label = (item.label || '').toLowerCase()
              const value = item.value || ''
              
              if (label.includes('ширина') || label.includes('width')) {
                specs.width = value
              } else if (label.includes('высота') || label.includes('height')) {
                specs.height = value
              } else if (label.includes('глубина') || label.includes('depth')) {
                specs.depth = value
              }
            })
          }
          
          // Также проверяем прямые поля в specs (если они есть)
          if (p.specs?.width) specs.width = String(p.specs.width)
          if (p.specs?.height) specs.height = String(p.specs.height)
          if (p.specs?.depth) specs.depth = String(p.specs.depth)
          
          // Сохраняем цвета товара
          if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
            const colorValues = p.colors.map((c: any) => {
              if (typeof c === 'object' && c !== null) {
                return (c as any).value || ''
              }
              return String(c)
            }).filter(Boolean)
            if (colorValues.length > 0) {
              colorsMap[p.id] = colorValues
            }
          }
          
          // Цвет берем из выбранного цвета в корзине или из первого цвета товара
          const cartItem = items.find(i => i.id === p.id)
          if (cartItem?.color) {
            specs.color = cartItem.color
          } else if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
            const firstColor = p.colors[0]
            specs.color = typeof firstColor === 'object' && firstColor !== null ? (firstColor as any).value : String(firstColor)
          }
          
          if (Object.keys(specs).length > 0) {
            specsMap[p.id] = specs
          }
        })
        
        setProductSpecs(specsMap)
        setProductColors(colorsMap)
      } catch (e) {
        console.error('Error loading product specs:', e)
      }
    }
    
    loadProductSpecs()
  }, [items])

  // Загружаем профиль пользователя при загрузке страницы
  useEffect(() => {
    async function loadUserProfile() {
      if (!session) return
      
      const userPhone = (session as any)?.phone
      if (!userPhone) return

      // Проверяем, не загружали ли уже профиль для этого телефона
      if (profileLoadedRef.current === userPhone) return
      profileLoadedRef.current = userPhone

      try {
        const { data, error } = await supabase
          .from('users_local')
          .select('name, phone')
          .eq('phone', userPhone)
          .single()

        if (!error && data) {
          setUserProfile({ name: data.name, phone: data.phone })
          // Автозаполняем поля, если они пустые
          setContact(prev => ({
            name: prev.name || data.name || '',
            phone: prev.phone || data.phone || '',
            email: prev.email || ''
          }))
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err)
        profileLoadedRef.current = null // Сбрасываем при ошибке, чтобы можно было повторить
      }
    }

    loadUserProfile()
  }, [session])

  // Подгружаем изображения модулей для тех, у кого они отсутствуют в корзине
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set(
          items.flatMap((it) => {
            const mods = (it.options as any)?.modules || []
            return mods.filter((m: any) => m && !m.image_url && m.id).map((m: any) => Number(m.id))
          })
        )) as number[]
        if (ids.length === 0) return
        const { data, error } = await supabase
          .from('product_modules')
          .select('id, image_url')
          .in('id', ids)
        if (error) throw error
        const map: Record<number, string> = {}
        ;(data || []).forEach((row: any) => { if (row?.id && row?.image_url) map[row.id] = row.image_url })
        if (Object.keys(map).length > 0) setModuleImages((prev) => ({ ...prev, ...map }))
      } catch (e) {
        // ignore
      }
    })()
  }, [items])

  async function placeOrder() {
    if (placing) return
    // валидация с подсветкой
    const nextErrors = {
      name: !contact.name,
      phone: !contact.phone,
      privacy: !consents.privacy,
      delivery: !deliveryType,
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || nextErrors.privacy || nextErrors.delivery) {
      setShowFillModal(true)
      return
    }
    // Адрес не обязателен: если пусто и выбран курьер, отправим без адреса — уточним по звонку
    try {
      setPlacing(true)
      // Получаем user_id из сессии, если пользователь авторизован
      // В NextAuth user.id может быть недоступен напрямую, используем phone для идентификации
      const userId = null // user_id будет null, так как используем phone для связи заказов
      
      const payload = {
        user_id: userId,
        contact,
        items: items.map(it => ({ id: it.id, name: it.name, qty: it.qty, price: it.price, color: it.color || null, options: it.options || null })),
        total,
        delivery: { type: deliveryType, address: address || null, needAssembly, needUtilization },
        payment: { method: paymentMethod },
      }
      const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await resp.json()
      if (!resp.ok || !data?.success) throw new Error(data?.error || 'Order error')
      clear()
      router.push(`/order/success?order=${data.id}`)
    } catch (e: any) {
      alert(e?.message || 'Не удалось оформить заказ')
    } finally {
      setPlacing(false)
    }
  }

  async function startDolyamePayment() {
    // Проверки формы
    if (placing) return
    const nextErrors = {
      name: !contact.name,
      phone: !contact.phone,
      privacy: !consents.privacy,
      delivery: !deliveryType,
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || nextErrors.privacy || nextErrors.delivery) {
      setShowFillModal(true)
      return
    }

    try {
      setPlacing(true)
      const userId = null

      // Сначала создаем заказ
      const payload = {
        user_id: userId,
        contact,
        items: items.map(it => ({ id: it.id, name: it.name, qty: it.qty, price: it.price, color: it.color || null, options: it.options || null })),
        total,
        delivery: { type: deliveryType, address: address || null, needAssembly, needUtilization },
        payment: { method: 'dolyame' },
      }
      
      const orderResp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const orderData = await orderResp.json()
      if (!orderResp.ok || !orderData?.success) {
        throw new Error(orderData?.error || 'Order creation failed')
      }
      
      const orderId = orderData.id

      // Создаем заявку в Долями
      const paymentPayload = {
        amount: total,
        orderId: orderId,
        items: items.map(it => ({ 
          id: it.id,
          name: it.name, 
          qty: it.qty, 
          price: it.price 
        })),
        customer: {
          name: contact.name,
          phone: contact.phone,
          email: contact.email || null,
        },
      }
      
      console.log('Creating Dolyame payment:', paymentPayload)
      
      const paymentResp = await fetch('/api/payments/dolyame/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      })
      
      let paymentData: any
      try {
        paymentData = await paymentResp.json()
      } catch (jsonError: any) {
        console.error('JSON parse error:', jsonError)
        const text = await paymentResp.text()
        console.error('Response text:', text)
        throw new Error(`Ошибка ответа сервера: ${text.substring(0, 100)}`)
      }
      
      console.log('Payment response:', { status: paymentResp.status, data: paymentData })
      
      if (!paymentResp.ok || !paymentData?.ok) {
        console.error('=== Payment Creation Failed ===')
        console.error('Status:', paymentResp.status)
        console.error('Response data:', paymentData)
        console.error('Error code:', paymentData?.errorCode)
        console.error('Error message:', paymentData?.error)
        const errorMessage = paymentData?.error || paymentData?.message || 'Не удалось создать платеж'
        const errorCode = paymentData?.errorCode ? ` (Код ошибки: ${paymentData.errorCode})` : ''
        throw new Error(`${errorMessage}${errorCode}`)
      }

      // Перенаправляем пользователя на страницу оплаты Долями
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl
      } else {
        throw new Error('Payment URL not received')
      }
    } catch (e: any) {
      alert(e?.message || 'Не удалось создать платеж')
      setPlacing(false)
    }
  }

  async function startTBankPayment() {
    // Проверки формы
    if (placing) return
    const nextErrors = {
      name: !contact.name,
      phone: !contact.phone,
      privacy: !consents.privacy,
      delivery: !deliveryType,
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || nextErrors.privacy || nextErrors.delivery) {
      setShowFillModal(true)
      return
    }

    try {
      setPlacing(true)
      const userId = null

      // Сначала создаем заказ
      const payload = {
        user_id: userId,
        contact,
        items: items.map(it => ({ id: it.id, name: it.name, qty: it.qty, price: it.price, color: it.color || null, options: it.options || null })),
        total,
        delivery: { type: deliveryType, address: address || null, needAssembly, needUtilization },
        payment: { method: paymentMethod === 'sberpay' ? 'sberpay' : 'card' },
      }
      
      const orderResp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const orderData = await orderResp.json()
      if (!orderResp.ok || !orderData?.success) {
        throw new Error(orderData?.error || 'Order creation failed')
      }

      const orderId = orderData.id
      const amountInKopecks = Math.round(total * 100)
      
      console.log('Opening T-Bank payment widget:', {
        orderId,
        amount: total,
        amountInKopecks,
        email: contact.email,
        phone: contact.phone,
      })

      // Создаем платеж через API и получаем PaymentURL для редиректа
      // Виджет T-Bank используется для инициализации, но для создания платежа нужен API вызов
      const paymentPayload = {
        amount: total,
        orderId: orderId,
        description: `Заказ #${orderId}`,
        email: contact.email || null,
        phone: contact.phone || null,
        items: items.map(it => ({ 
          name: it.name, 
          qty: it.qty, 
          price: it.price 
        })), // Передаем товары для формирования Receipt
      }
      
      console.log('Creating T-Bank payment:', paymentPayload)
      
      let paymentResp: Response
      let paymentData: any
      
      try {
        paymentResp = await fetch('/api/payments/tbank/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentPayload),
        })
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Не удалось подключиться к серверу: ${fetchError?.message || 'Unknown error'}`)
      }

      try {
        paymentData = await paymentResp.json()
      } catch (jsonError: any) {
        console.error('JSON parse error:', jsonError)
        const text = await paymentResp.text()
        console.error('Response text:', text)
        throw new Error(`Ошибка ответа сервера: ${text.substring(0, 100)}`)
      }
      
      console.log('Payment response:', { status: paymentResp.status, data: paymentData })
      
      if (!paymentResp.ok || !paymentData?.ok) {
        console.error('=== Payment Creation Failed ===')
        console.error('Status:', paymentResp.status)
        console.error('Response data:', paymentData)
        console.error('Error code:', paymentData?.errorCode)
        console.error('Error message:', paymentData?.error)
        const errorMessage = paymentData?.error || paymentData?.message || 'Не удалось создать платеж'
        const errorCode = paymentData?.errorCode ? ` (Код ошибки: ${paymentData.errorCode})` : ''
        throw new Error(`${errorMessage}${errorCode}`)
      }

      // Перенаправляем пользователя на страницу оплаты T-Bank
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl
      } else {
        throw new Error('Payment URL not received')
      }
    } catch (e: any) {
      alert(e?.message || 'Не удалось создать платеж')
      setPlacing(false)
    }
  }

  async function startYandexPay() {
    // те же проверки формы, что и placeOrder
    if (placing) return
    const nextErrors = {
      name: !contact.name,
      phone: !contact.phone,
      privacy: !consents.privacy,
      delivery: !deliveryType,
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || nextErrors.privacy || nextErrors.delivery) {
      setShowFillModal(true)
      return
    }

    try {
      setYpLoading(true)
      // 1) Получаем параметры для SDK
      const resp = await fetch('/api/payments/yandex/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, orderId: undefined })
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) throw new Error(data?.error || 'yandex create failed')

      // 2) Ждём загрузки Web SDK Яндекс Пэй (загружается через Next.js Script в layout)
      // Пробуем загрузить SDK, если он еще не загружен
      try {
        await waitForYandexPaySdk()
      } catch (sdkError: any) {
        console.error('Failed to wait for Yandex Pay SDK:', sdkError)
        
        // Пробуем загрузить SDK динамически как альтернативу
        console.log('Attempting to load SDK dynamically...')
        try {
          await loadYandexPaySdkDynamically()
          console.log('✓ SDK loaded dynamically')
        } catch (dynamicError: any) {
          console.error('Dynamic SDK load also failed:', dynamicError)
          alert(`Ошибка загрузки Яндекс Pay SDK.\n\n${sdkError.message || 'SDK не загрузился'}\n\nПроверьте:\n1. Подключение к интернету\n2. Консоль браузера (F12) для подробностей\n3. Настройки домена в консоли Яндекс Pay\n4. Блокировку скриптов браузером/расширениями`)
          setYpLoading(false)
          return
        }
      }

      const ya: any = (window as any).YaPay

      if (!ya) {
        console.error('YaPay object not found after SDK load')
        alert('Яндекс Pay SDK загружен, но объект YaPay не найден. Проверьте консоль браузера.')
        setYpLoading(false)
        return
      }

      if (typeof ya.createCheckout === 'function') {
        // Поддержка разных вариантов названий переменных
        const merchantId = data.merchantId || 
          (process.env.NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID as any) ||
          (process.env.NEXT_PUBLIC_YANDEX_MERCHANT_ID as any)
        
        // Формат для SDK v2 согласно документации Яндекс Pay
        // SDK v2 использует класс Price для amount
        const totalAmount = Number(data.amount || total).toFixed(2)
        
        // Используем класс Price из SDK, если доступен
        const ya: any = (window as any).YaPay
        const Price = ya?.Price || ya?.createPrice
        
        // Формируем amount используя класс Price или объект с правильной структурой
        const createPrice = (value: string, currency: string = 'RUB') => {
          if (Price && typeof Price === 'function') {
            return new Price(value, currency)
          }
          // Если класс Price недоступен, используем объект с правильной структурой для v2
          return {
            value: value,
            currency: currency
          }
        }
        
        const paymentItems = items.map((it) => {
          const itemTotal = (it.price * it.qty).toFixed(2)
          return {
            label: it.name,
            quantity: { count: String(it.qty) },
            amount: createPrice(itemTotal, 'RUB')
          }
        })

        // Формат для SDK v2
        const paymentData: any = {
          version: 2,
          merchant: { 
            id: String(merchantId), 
            name: 'ARTECO' 
          },
          currencyCode: 'RUB',
          countryCode: 'RU',
          order: {
            id: String(data.orderId),
            total: {
              amount: createPrice(String(totalAmount), 'RUB')
            },
            items: paymentItems
          }
        }

        // Добавляем buyer, если есть телефон
        if (contact.phone) {
          paymentData.buyer = { phone: contact.phone }
        }

        // Добавляем Split (оплата частями), если включен и выбран метод оплаты Split
        if (data.enableSplit && paymentMethod === 'split') {
          paymentData.split = {
            enabled: true,
            // Можно указать минимальную сумму для Split (например, от 3000 рублей)
            minAmount: { value: '3000.00', currency: 'RUB' }
          }
        }

        // Создаём checkout с обработчиками событий
        // Согласно документации SDK v1, subscriptions передаются в createCheckout
        const checkoutOptions: any = {
          env: data.env || 'test',
        }

        // Обработчики событий для SDK v2
        // SDK требует подписку на событие process (согласно предупреждению)
        const subscriptions: any = {
          process: (ev: any) => {
            console.log('✓ Yandex Pay process event:', ev)
            // Событие process вызывается при начале обработки платежа
          },
          abort: () => {
            console.log('Yandex Pay abort event')
            setYpLoading(false)
          },
          fail: (ev: any) => {
            console.warn('Yandex Pay fail event:', ev)
            setYpLoading(false)
          },
          success: async (ev: any) => {
            try {
              console.log('✓ Yandex Pay success event:', ev)
              setPaymentMethod('yap')
              await placeOrder()
            } catch (e) {
              console.error('placeOrder after success event error', e)
            } finally {
              setYpLoading(false)
            }
          }
        }

        // Добавляем subscriptions в options
        checkoutOptions.subscriptions = subscriptions

        console.log('Creating Yandex Pay checkout with data:', JSON.stringify(paymentData, null, 2))
        console.log('Checkout options:', checkoutOptions)

        let checkout: any
        try {
          // createCheckout может возвращать Promise, поэтому await
          const checkoutResult = ya.createCheckout(paymentData, checkoutOptions)
          
          // Проверяем, является ли результат Promise
          if (checkoutResult && typeof checkoutResult.then === 'function') {
            console.log('Checkout is a Promise, awaiting...')
            checkout = await checkoutResult
            console.log('✓ Checkout promise resolved:', checkout)
          } else {
            checkout = checkoutResult
            console.log('✓ Checkout created (synchronous):', checkout)
          }
          
          console.log('Checkout type:', typeof checkout)
          if (checkout) {
            console.log('Checkout keys:', Object.keys(checkout))
            console.log('Checkout prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(checkout)))
          }
        } catch (createError: any) {
          console.error('✗ Error creating checkout:', createError)
          console.error('Error details:', createError?.stack || createError?.message)
          throw new Error(`Не удалось создать checkout: ${createError.message || 'Unknown error'}`)
        }

        // Проверяем доступные методы и свойства checkout
        const checkoutMethods = {
          hasOpen: typeof checkout?.open === 'function',
          hasPay: typeof checkout?.pay === 'function',
          hasMount: typeof checkout?.mount === 'function',
          hasRender: typeof checkout?.render === 'function',
          hasShow: typeof checkout?.show === 'function',
          hasUpdate: typeof checkout?.update === 'function',
          hasWidget: !!checkout?.widget,
          hasOverlay: !!checkout?.overlay,
          hasButtons: !!checkout?.buttons,
          checkoutType: typeof checkout,
          checkoutKeys: checkout ? Object.keys(checkout) : []
        }
        console.log('Checkout methods available:', checkoutMethods)
        console.log('Checkout widget:', checkout?.widget)
        console.log('Checkout overlay:', checkout?.overlay)
        console.log('Checkout buttons:', checkout?.buttons)

        // SDK v2 может использовать разные методы в зависимости от версии
        let windowOpened = false
        
        try {
          // Вариант 1: checkout.widget - виджет для встраивания
          if (checkout?.widget && typeof checkout.widget.mount === 'function') {
            console.log('Using checkout.widget.mount()...')
            let container = document.getElementById('yandex-pay-checkout-container')
            if (!container) {
              container = document.createElement('div')
              container.id = 'yandex-pay-checkout-container'
              container.style.position = 'fixed'
              container.style.top = '50%'
              container.style.left = '50%'
              container.style.transform = 'translate(-50%, -50%)'
              container.style.zIndex = '10000'
              document.body.appendChild(container)
            }
            checkout.widget.mount(container)
            windowOpened = true
            console.log('✓ Checkout widget mounted')
          }
          // Вариант 2: checkout.overlay - оверлей для модального окна
          else if (checkout?.overlay && typeof checkout.overlay.show === 'function') {
            console.log('Using checkout.overlay.show()...')
            checkout.overlay.show()
            windowOpened = true
            console.log('✓ Checkout overlay shown')
          }
          // Вариант 3: checkout.buttons - кнопки для оплаты
          else if (checkout?.buttons && Array.isArray(checkout.buttons) && checkout.buttons.length > 0) {
            console.log('Using checkout.buttons...')
            // Кнопки могут автоматически открывать форму
            windowOpened = true
            console.log('✓ Checkout buttons available, form should open automatically')
          }
          // Вариант 4: checkout.mount() - для встраивания в DOM элемент
          else if (typeof checkout.mount === 'function') {
            console.log('Using checkout.mount()...')
            let container = document.getElementById('yandex-pay-checkout-container')
            if (!container) {
              container = document.createElement('div')
              container.id = 'yandex-pay-checkout-container'
              container.style.position = 'fixed'
              container.style.top = '50%'
              container.style.left = '50%'
              container.style.transform = 'translate(-50%, -50%)'
              container.style.zIndex = '10000'
              document.body.appendChild(container)
            }
            checkout.mount(container)
            windowOpened = true
            console.log('✓ Checkout mounted')
          }
          // Вариант 5: checkout.open() - для открытия в модальном окне
          else if (typeof checkout.open === 'function') {
            console.log('Calling checkout.open()...')
            const openResult = checkout.open()
            if (openResult && typeof openResult.then === 'function') {
              await openResult
            }
            windowOpened = true
            console.log('✓ Checkout opened')
          }
          // Вариант 6: checkout.show() - альтернативный метод открытия
          else if (typeof checkout.show === 'function') {
            console.log('Calling checkout.show()...')
            checkout.show()
            windowOpened = true
            console.log('✓ Checkout shown')
          }
          // Вариант 7: checkout.update() - может обновить и открыть форму
          else if (typeof checkout.update === 'function') {
            console.log('Using checkout.update()...')
            try {
              // update может открыть форму после обновления данных
              const updateResult = checkout.update(paymentData)
              if (updateResult && typeof updateResult.then === 'function') {
                await updateResult
              }
              // После update может потребоваться вызвать метод для открытия
              // Проверяем, появились ли методы после update
              if (typeof checkout.open === 'function') {
                await checkout.open()
              } else if (typeof checkout.show === 'function') {
                checkout.show()
              } else if (checkout?.overlay && typeof checkout.overlay.show === 'function') {
                checkout.overlay.show()
              }
              windowOpened = true
              console.log('✓ Checkout updated and opened')
            } catch (updateError: any) {
              console.error('Error updating checkout:', updateError)
              throw updateError
            }
          }
          // Вариант 8: checkout может автоматически открываться после создания
          else {
            console.warn('⚠️ Checkout created but no known methods found')
            console.warn('Checkout object structure:', {
              keys: Object.keys(checkout),
              widget: checkout?.widget,
              overlay: checkout?.overlay,
              buttons: checkout?.buttons,
              prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(checkout))
            })
            
            // Возможно, checkout автоматически открывается или требует другого подхода
            // Даём время SDK автоматически открыть окно
            const autoOpenTimeout = setTimeout(() => {
              if (!windowOpened) {
                console.warn('Window did not open automatically after 3 seconds')
                console.warn('Try checking checkout.widget, checkout.overlay, or checkout.buttons')
                setYpLoading(false)
              }
            }, 3000)
            
            // Предполагаем, что окно может открыться автоматически
            windowOpened = true
            
            // Очищаем таймаут, если окно открылось
            setTimeout(() => clearTimeout(autoOpenTimeout), 3000)
          }
        } catch (e: any) {
          console.error('✗ Yandex Pay error:', e)
          console.error('Error details:', e?.stack || e?.message)
          alert(`Ошибка Яндекс Pay: ${e?.message || 'Не удалось открыть форму оплаты'}\n\nПроверьте консоль браузера для подробностей.`)
          setYpLoading(false)
          return
        }

        // Если окно открылось, не сбрасываем ypLoading - ждём события
        if (!windowOpened) {
          console.warn('Window did not open, resetting ypLoading')
          setYpLoading(false)
        } else {
          console.log('✓ Window opened successfully, waiting for events')
        }
      } else {
        // Фоллбек: если SDK не предоставил createCheckout, используем обычный флоу
        setPaymentMethod('yap')
        await placeOrder()
        setYpLoading(false)
      }
    } catch (e: any) {
      alert(e?.message || 'Не удалось открыть Yandex Pay')
      setYpLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1680px] 2xl:max-w-none px-4 md:px-2 xl:px-4 2xl:px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Корзина</h1>
      {items.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="mb-3">Ваша корзина пуста</div>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white">Перейти в каталог →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
            {items.map((it) => {
              const key = `${it.id}|${it.color || ''}|${it.options ? JSON.stringify(it.options) : ''}`
              return (
                <div key={key} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <Link href={`/product/${it.id}`} className="flex-shrink-0">
                      <img src={it.image_url || '/placeholder.jpg'} alt={it.name} className="w-24 h-24 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/product/${it.id}`} className="font-medium line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                          {it.name}
                        </Link>
                        {/* Цена справа на одном уровне с названием */}
                        <div className="text-right font-semibold whitespace-nowrap">{(it.price * it.qty).toLocaleString('ru-RU')} ₽</div>
                      </div>
                    {/* Характеристики: Ширина, Высота, Глубина */}
                    {(productSpecs[it.id]?.width || productSpecs[it.id]?.height || productSpecs[it.id]?.depth) && (
                      <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                        {productSpecs[it.id]?.width && <div>Ширина: {productSpecs[it.id].width}</div>}
                        {productSpecs[it.id]?.height && <div>Высота: {productSpecs[it.id].height}</div>}
                        {productSpecs[it.id]?.depth && <div>Глубина: {productSpecs[it.id].depth}</div>}
                      </div>
                    )}
                    {/* Свотчи цветов (как в карточке товара) */}
                    {productColors[it.id] && productColors[it.id].length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1.5">Цвет:</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {productColors[it.id].map((colorValue, idx) => {
                            const isImageUrl = typeof colorValue === 'string' && (colorValue.startsWith('http') || colorValue.startsWith('/'))
                            const selectedColor = productSpecs[it.id]?.color || it.color
                            const isSelected = colorValue === selectedColor
                            
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                {isImageUrl ? (
                                  <div className={`w-8 h-8 rounded-full border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-gray-300'} overflow-hidden flex-shrink-0`}>
                                    <img src={colorValue} alt={`Цвет ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-8 h-8 rounded-full border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-gray-300'}`}
                                    style={{ background: colorValue || '#ccc' }}
                                    title={colorValue || 'Цвет'}
                                  />
                                )}
                                {isSelected && (
                                  <span className="text-xs text-gray-700">{colorValue}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {/* Опции */}
                    {it.options && (
                      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {it.options.filling && <div>Наполнение: {it.options.filling.name} {it.options.filling.delta_price ? `(+${it.options.filling.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.hinge && <div>Петли: {it.options.hinge.name} {it.options.hinge.delta_price ? `(+${it.options.hinge.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.drawer && <div>Ящики: {it.options.drawer.name} {it.options.drawer.delta_price ? `(+${it.options.drawer.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.lighting && <div>Подсветка: {it.options.lighting.name} {it.options.lighting.delta_price ? `(+${it.options.lighting.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {/* Модули (если пользователь добавлял) */}
                        {Array.isArray((it.options as any).modules) && (it.options as any).modules.length > 0 && (
                          <div className="pt-1">
                            <div className="font-medium text-gray-700 mb-1">Модули</div>
                            <div className="mt-2 overflow-x-auto -mx-1 px-1">
                              <div className="flex gap-2">
                                {(it.options as any).modules.map((m: any, idx: number) => (
                                  <div key={idx} className="w-[200px] flex-shrink-0 border rounded-lg bg-white overflow-hidden">
                                    <div className="relative w-full h-24 bg-gray-100">
                                      {(m.image_url || moduleImages[m.id as number]) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={(m.image_url || moduleImages[m.id as number])} alt={m.name} className="w-full h-full object-cover" />
                                      ) : null}
                                    </div>
                                    <div className="p-2">
                                      <div className="font-medium text-sm truncate" title={m.name}>{m.name}</div>
                                      <div className="text-xs text-gray-500 mt-1">Количество: {m.qty || 1}</div>
                                      <div className="text-sm font-semibold mt-1">{(m.price * (m.qty || 1)).toLocaleString('ru-RU')} ₽</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                  {/* Количество и удалить снизу в контейнере */}
                  <div className="flex justify-end items-center gap-2">
                    <button className="w-8 h-8 border rounded" onClick={() => updateQty(it.id, it.qty - 1, key)}>-</button>
                    <div className="px-2 text-sm">{it.qty}</div>
                    <button className="w-8 h-8 border rounded" onClick={() => updateQty(it.id, it.qty + 1, key)}>+</button>
                    <button className="ml-3 text-sm text-red-600" onClick={() => remove(it.id, key)}>Удалить</button>
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end">
              <button className="text-sm text-gray-500 hover:text-black" onClick={clear}>Очистить корзину</button>
            </div>

            {/* Рекомендации над формой */}
            {suggested.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">Вам может подойти</h2>
                  <button
                    className="text-gray-700 hover:text-black text-sm md:text-base flex items-center gap-2 select-none"
                    onClick={() => setSuggestedOpen(v => !v)}
                  >
                    {suggestedOpen ? 'Свернуть' : 'Развернуть'}
                    <span
                      className={`ml-0 inline-grid place-items-center w-6 h-6 rounded-full text-white bg-black shadow-sm ring-1 ring-black/10 transition-all duration-300 ${suggestedOpen ? 'rotate-180 scale-100 opacity-100' : 'scale-110 opacity-95 animate-pulse'}`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>
                </div>

                <div className={`transition-all duration-500 ease-in-out ${suggestedOpen ? 'opacity-0 -translate-y-1 h-0 max-h-0 overflow-hidden' : 'opacity-100 translate-y-0 h-auto'}`}>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="flex gap-3">
                      {(suggested.slice(0, 8)).map((p) => (
                        <a key={p.id} href={`/product/${p.id}`} className="block w-24 h-24 rounded-xl overflow-hidden bg-white border flex-shrink-0">
                          <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${suggestedOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}`}>
                  <ProductGrid
                    products={suggested as any}
                    horizontal
                    onAdd={(p) => add({ id: p.id as any, name: p.name as any, price: (p as any).price as any, image_url: (p as any).image_url as any }, 1)}
                  />
                </div>
              </div>
            )}

            {/* Заполните информацию о себе */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Заполните информацию о себе</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Имя"
                  value={contact.name}
                  onChange={e => { setContact({ ...contact, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: false }) }}
                />
                <input
                  className={`w-full border rounded-lg px-3 py-2 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="Телефон"
                  value={contact.phone}
                  onChange={e => { setContact({ ...contact, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: false }) }}
                />
                <div className="sm:col-span-2">
                  <input
                    type="email"
                    className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 bg-blue-50/50 focus:border-blue-500 focus:bg-blue-50 focus:outline-none transition-colors"
                    placeholder="Почта (для уведомлений о статусе заказа)"
                    value={contact.email}
                    onChange={e => setContact({ ...contact, email: e.target.value })}
                  />
                  <p className="mt-2 text-xs text-blue-600 flex items-start gap-1.5">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Укажите email, чтобы получать уведомления об изменении статуса вашего заказа</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">Чтобы оформить заказ, нам нужно разрешение на использование ваших данных:</div>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptAll} onChange={toggleAcceptAll} />
                  <span>Принять все</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.privacy} onChange={() => { setConsents(v => ({ ...v, privacy: !v.privacy })); if (errors.privacy) setErrors({ ...errors, privacy: false }) }} />
                  <span>
                    Согласен на обработку персональных данных на условиях Политики конфиденциальности
                    <span className="text-red-500"> *</span>
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.marketing} onChange={() => setConsents(v => ({ ...v, marketing: !v.marketing }))} />
                  <span>Согласен на получение рассылок рекламно-информационного характера</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.calls} onChange={() => setConsents(v => ({ ...v, calls: !v.calls }))} />
                  <span>Согласен на получение массовых и автоматических звонков</span>
                </label>
              </div>
            </section>

            {/* Выберите способ доставки */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Выберите способ доставки</div>
              <div className="flex items-center gap-2 text-sm mb-4">
                <button type="button" className={`px-4 py-2 rounded-full border ${deliveryType==='courier' ? 'bg-black text-white border-black' : 'bg-white'}`} onClick={()=>setDeliveryType('courier')}>Курьер</button>
                <button type="button" className={`px-4 py-2 rounded-full border ${deliveryType==='pickup' ? 'bg-black text-white border-black' : 'bg-white'}`} onClick={()=>setDeliveryType('pickup')}>Самовывоз</button>
              </div>
              {deliveryType === 'courier' && (
                <div className="relative mb-4">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Адрес"
                    value={address}
                    onChange={e=>{ setAddress(e.target.value); setAddrQuery(e.target.value) }}
                    onFocus={()=>{ if (addrSuggests.length>0) setAddrOpen(true) }}
                    onBlur={()=> setTimeout(()=> setAddrOpen(false), 150)}
                  />
                  {addrOpen && (addrLoading || addrSuggests.length>0) && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-40 max-h-64 overflow-auto">
                      {addrLoading && <div className="px-3 py-2 text-sm text-gray-500">Загрузка…</div>}
                      {!addrLoading && addrSuggests.map((s) => (
                        <button
                          type="button"
                          key={s}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onMouseDown={(e)=> e.preventDefault()}
                          onClick={()=>{ setAddress(s); setAddrQuery(s); setAddrOpen(false) }}
                        >
                          {s}
                        </button>
                      ))}
                      {!addrLoading && addrSuggests.length===0 && addrQuery.length>=3 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Ничего не найдено</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needAssembly} onChange={()=>setNeedAssembly(v=>!v)} />
                  <span>Необходима сборка мебели</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needUtilization} onChange={()=>setNeedUtilization(v=>!v)} />
                  <span>Необходима утилизация мебели</span>
                </label>
              </div>
            </section>

            {/* Выберите способ оплаты */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Выберите способ оплаты</div>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                  <span>Наличными при получении</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='yap'} onChange={()=>setPaymentMethod('yap')} />
                  <span>Оплата Яндекс Пэй</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} />
                  <span>Оплата картой онлайн или через СБП</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='invoice'} onChange={()=>setPaymentMethod('invoice')} />
                  <span>Безналичная оплата по счёту</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='sberpay'} onChange={()=>setPaymentMethod('sberpay')} />
                  <span>Оплатить онлайн через SberPay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='split'} onChange={()=>setPaymentMethod('split')} />
                  <span>Частями с Яндекс Сплит</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='installment'} onChange={()=>setPaymentMethod('installment')} />
                  <span>В рассрочку</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='dolyame'} onChange={()=>setPaymentMethod('dolyame')} />
                  <span>Оплата частями с Долями</span>
                </label>
              </div>
            </section>

            
          </div>
          <div className="bg-white border rounded-xl p-5 h-max sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div>Итого</div>
              <div className="text-2xl font-bold">{total.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div className="text-sm text-gray-500 mb-4">Доставка и сборка будут рассчитаны менеджером после подтверждения заказа.</div>
            {paymentMethod === 'yap' || paymentMethod === 'split' ? (
              <button
                onClick={startYandexPay}
                disabled={placing || ypLoading}
                className="block w-full text-center py-3 rounded-full bg-black text-white font-semibold disabled:opacity-60"
              >
                {ypLoading 
                  ? 'Открываем Yandex Pay…' 
                  : paymentMethod === 'split' 
                    ? 'Оплатить частями с Яндекс Сплит' 
                    : 'Оплатить через Yandex Pay'}
              </button>
            ) : paymentMethod === 'card' || paymentMethod === 'sberpay' ? (
              <button
                onClick={startTBankPayment}
                disabled={placing}
                className="block w-full text-center py-3 rounded-full bg-black text-white font-semibold disabled:opacity-60"
              >
                {placing ? 'Создаём платёж…' : paymentMethod === 'sberpay' ? 'Оплатить через SberPay' : 'Оплатить картой онлайн'}
              </button>
            ) : paymentMethod === 'dolyame' ? (
              <button
                onClick={startDolyamePayment}
                disabled={placing}
                className="block w-full text-center py-3 rounded-full bg-black text-white font-semibold disabled:opacity-60"
              >
                {placing ? 'Создаём заявку…' : 'Оплатить частями с Долями'}
              </button>
            ) : (
              <button onClick={placeOrder} disabled={placing} className="block w-full text-center py-3 rounded-full bg-black text-white font-semibold disabled:opacity-60">
                {placing ? 'Оформляем…' : 'Оформить заказ'}
              </button>
            )}
            <div className="mt-3 text-xs text-gray-500">Нажимая кнопку, вы принимаете условия оферты.</div>
          </div>
        </div>
      )}

      {/* Модалка: заполните поля */}
      {showFillModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center" role="dialog" aria-modal>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-[92%] p-5 text-center">
            <div className="text-lg font-semibold mb-2">Заполните, пожалуйста, поля</div>
            <div className="text-sm text-gray-600 mb-4">
              {errors.name && <div>— Имя</div>}
              {errors.phone && <div>— Телефон</div>}
              {errors.privacy && <div>— Согласие на обработку персональных данных</div>}
              {errors.delivery && <div>— Выберите способ доставки</div>}
            </div>
            <button className="px-5 py-2 rounded-full bg-black text-white" onClick={() => setShowFillModal(false)}>Понятно</button>
          </div>
        </div>
      )}
    </div>
  )
}
