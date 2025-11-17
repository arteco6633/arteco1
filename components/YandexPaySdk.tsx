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

  useEffect(() => {
    // Проверяем, если SDK уже загружен
    if (typeof window !== 'undefined' && window.YaPay) {
      setIsLoaded(true)
      console.log('✓ Yandex Pay SDK already available')
    }
  }, [])

  return (
    <Script
      src="https://pay.yandex.ru/sdk/v1/pay.js"
      strategy="afterInteractive"
      onLoad={() => {
        // Проверяем доступность SDK после загрузки
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.YaPay) {
            setIsLoaded(true)
            console.log('✓ Yandex Pay SDK loaded successfully')
            // Глобальное событие для уведомления о загрузке SDK
            window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
          } else {
            console.warn('Yandex Pay SDK script loaded but YaPay object not found')
            // Пробуем ещё раз через небольшую задержку
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.YaPay) {
                setIsLoaded(true)
                console.log('✓ Yandex Pay SDK loaded (delayed check)')
                window.dispatchEvent(new Event('yandex-pay-sdk-loaded'))
              } else {
                console.warn('YaPay object still not found after script load')
                console.warn('This may be normal on localhost due to CORS restrictions')
              }
            }, 500)
          }
        }, 200)
      }}
      onError={(e) => {
        // CORS ошибки на localhost - это нормально, SDK требует HTTPS
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        
        if (isLocalhost) {
          console.warn('⚠️ Yandex Pay SDK cannot load on localhost (HTTP) due to CORS')
          console.warn('This is expected behavior. SDK requires HTTPS.')
          console.warn('The SDK will work correctly on production domain with HTTPS.')
        } else {
          console.error('Failed to load Yandex Pay SDK:', e)
          console.error('SDK URL: https://pay.yandex.ru/sdk/v1/pay.js')
        }
      }}
      onReady={() => {
        console.log('Yandex Pay SDK script ready')
      }}
    />
  )
}
