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
      window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
    }
  }, [])

  // Функция для проверки доступности SDK
  const checkSdkAvailability = () => {
    if (typeof window !== 'undefined' && window.YaPay) {
      setIsLoaded(true)
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
            // Только на production показываем предупреждение
            const isLocalhost = typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            
            if (!isLocalhost) {
              console.debug('Yandex Pay SDK script loaded but YaPay object not found. This may indicate domain whitelist or CORS issues.')
            }
          }
        }

        setTimeout(checkWithDelay, delays[0])
      }}
      onError={(e) => {
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        
        if (isLocalhost) {
          // На localhost это ожидаемое поведение, не показываем как ошибку
          console.debug('ℹ️ Yandex Pay SDK cannot load on localhost (HTTP) - this is expected. SDK requires HTTPS and will work on production.')
        } else {
          // На production показываем как предупреждение, а не ошибку
          console.warn('⚠️ Failed to load Yandex Pay SDK')
          console.warn('SDK URL:', SDK_URL)
          console.warn('Please check:')
          console.warn('1. Domain whitelist in Yandex Pay console')
          console.warn('2. Network tab for script loading status')
          console.warn('3. CORS configuration')
        }
        
        // Отправляем событие об ошибке для обработки в cart/page.tsx
        window.dispatchEvent(new CustomEvent('yandex-pay-sdk-error', { detail: { error: e, url: SDK_URL } }))
      }}
      onReady={() => {
        // SDK готов, проверяем доступность
        checkSdkAvailability()
      }}
    />
  )
}
