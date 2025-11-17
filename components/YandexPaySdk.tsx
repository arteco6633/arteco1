'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    YaPay?: any
  }
}

/**
 * Компонент для загрузки Яндекс Pay SDK
 * Использует Next.js Script component для правильной загрузки
 * 
 * ВАЖНО: Яндекс Pay SDK требует HTTPS!
 * На localhost (HTTP) могут быть CORS ошибки - это нормально.
 * SDK будет работать на production домене с HTTPS.
 */
export default function YandexPaySdk() {
  const [isLoaded, setIsLoaded] = useState(false)
  const SDK_URL = 'https://pay.yandex.ru/sdk/v2/pay.js'

  useEffect(() => {
    // Проверяем, если SDK уже загружен
    if (typeof window !== 'undefined' && window.YaPay) {
      setIsLoaded(true)
      console.log('✓ Yandex Pay SDK already available')
      window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
    }
  }, [])

  // Функция для проверки доступности SDK
  const checkSdkAvailability = () => {
    if (typeof window !== 'undefined' && window.YaPay) {
      setIsLoaded(true)
      console.log('✓ Yandex Pay SDK is available')
      window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
      return true
    }
    return false
  }

  return (
    <Script
      src={SDK_URL}
      strategy="afterInteractive"
      onLoad={() => {
        console.log('✓ Yandex Pay SDK script loaded from:', SDK_URL)
        
        // Проверяем статус загрузки скрипта
        const scripts = document.querySelectorAll('script[src*="pay.yandex.ru"]')
        console.log('Found Yandex Pay scripts in DOM:', scripts.length)
        scripts.forEach((script: any, idx: number) => {
          const src = script.getAttribute('src')
          const complete = script.complete
          const readyState = script.readyState
          console.log(`Script ${idx + 1}:`, {
            src,
            complete,
            readyState,
            onload: typeof script.onload,
            onerror: typeof script.onerror
          })
        })
        
        // Проверяем доступность SDK сразу после загрузки
        if (checkSdkAvailability()) {
          return
        }

        // Если SDK не найден сразу, проверяем с задержками
        const delays = [100, 300, 500, 1000, 2000, 3000, 5000]
        let attempt = 0

        const checkWithDelay = () => {
          if (checkSdkAvailability()) {
            return
          }

          attempt++
          if (attempt < delays.length) {
            setTimeout(checkWithDelay, delays[attempt] - (delays[attempt - 1] || 0))
          } else {
            console.warn('⚠️ Yandex Pay SDK script loaded but YaPay object not found after multiple attempts')
            console.warn('SDK URL:', SDK_URL)
            console.warn('Current domain:', window.location.hostname)
            console.warn('Protocol:', window.location.protocol)
            console.warn('This may indicate:')
            console.warn('1. Domain not whitelisted in Yandex Pay console')
            console.warn('2. CORS restrictions')
            console.warn('3. Browser extensions blocking script execution')
            console.warn('4. Issues on Yandex Pay server side')
            console.warn('5. Script loaded but failed to execute')
            
            // Проверяем, есть ли ошибки в консоли
            console.warn('Please check Network tab for:', SDK_URL)
            console.warn('Look for:')
            console.warn('- Status code (should be 200)')
            console.warn('- CORS headers')
            console.warn('- Response content')
            
            // Пробуем проверить глобальные объекты
            console.log('Checking global objects:')
            console.log('- window.YaPay:', typeof window.YaPay)
            console.log('- window.YandexPay:', typeof (window as any).YandexPay)
            console.log('- window.pay:', typeof (window as any).pay)
          }
        }

        setTimeout(checkWithDelay, delays[0])
      }}
      onError={(e) => {
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        
        console.error('✗ Failed to load Yandex Pay SDK')
        console.error('SDK URL:', SDK_URL)
        console.error('Error:', e)
        
        if (isLocalhost) {
          console.warn('⚠️ Yandex Pay SDK cannot load on localhost (HTTP) due to CORS')
          console.warn('This is expected behavior. SDK requires HTTPS.')
          console.warn('The SDK will work correctly on production domain with HTTPS.')
        } else {
          console.error('⚠️ Production domain error - check:')
          console.error('1. Internet connection')
          console.error('2. Browser console (F12) for details')
          console.error('3. Network tab - is the script loading?')
          console.error('4. Yandex Pay server status')
        }
        
        // Отправляем событие об ошибке для обработки в cart/page.tsx
        window.dispatchEvent(new CustomEvent('yandex-pay-sdk-error', { detail: { error: e, url: SDK_URL } }))
      }}
      onReady={() => {
        console.log('Yandex Pay SDK script ready (onReady callback)')
      }}
    />
  )
}
