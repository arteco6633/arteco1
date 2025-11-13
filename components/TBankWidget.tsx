'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    PaymentIntegration?: any
    onPaymentIntegrationLoad?: () => void
  }
}

interface TBankWidgetProps {
  terminalKey: string
  onReady?: () => void
  onError?: (error: Error) => void
}

export default function TBankWidget({ terminalKey, onReady, onError }: TBankWidgetProps) {
  const scriptLoadedRef = useRef(false)
  const initializedRef = useRef(false)

  const initializeWidget = useCallback(() => {
    if (initializedRef.current) return
    if (!window.PaymentIntegration) {
      console.warn('PaymentIntegration not available')
      return
    }

    try {
      const initConfig = {
        terminalKey: terminalKey,
        product: 'eacq',
        features: {
          payment: {}, // Для кнопок оплаты
          iframe: {}, // Для открытия платежной формы в iframe
        },
      }

      window.PaymentIntegration.init(initConfig)
        .then(() => {
          initializedRef.current = true
          console.log('T-Bank widget initialized successfully')
          onReady?.()
        })
        .catch((error: any) => {
          console.error('T-Bank widget initialization error:', error)
          onError?.(error)
        })
    } catch (error: any) {
      console.error('T-Bank widget initialization exception:', error)
      onError?.(error)
    }
  }, [terminalKey, onReady, onError])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!terminalKey) return
    if (scriptLoadedRef.current) return

    // Проверяем, не загружен ли уже скрипт
    if (window.PaymentIntegration) {
      initializeWidget()
      return
    }

    // Загружаем скрипт интеграции
    const script = document.createElement('script')
    script.src = 'https://integrationjs.tbank.ru/integration.js'
    script.async = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initializeWidget()
    }
    script.onerror = () => {
      const error = new Error('Не удалось загрузить скрипт T-Bank')
      console.error('T-Bank script load error:', error)
      onError?.(error)
    }

    // Определяем функцию инициализации
    window.onPaymentIntegrationLoad = initializeWidget

    document.body.appendChild(script)

    return () => {
      // Очистка при размонтировании
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [terminalKey, initializeWidget, onError])

  // Экспортируем функцию через window для использования в других компонентах
  const openPaymentFormMemo = useCallback((paymentUrl: string) => {
    if (!window.PaymentIntegration || !initializedRef.current) {
      console.error('T-Bank widget not initialized')
      return Promise.reject(new Error('Виджет не инициализирован'))
    }

    return new Promise((resolve, reject) => {
      try {
        // Используем виджет для открытия формы оплаты
        // Если виджет поддерживает открытие по URL
        if (window.PaymentIntegration.openPaymentForm) {
          window.PaymentIntegration.openPaymentForm({
            url: paymentUrl,
            onSuccess: () => resolve(undefined),
            onError: (error: any) => reject(error),
          })
        } else {
          // Если метод не поддерживается, просто редиректим
          window.location.href = paymentUrl
          resolve(undefined)
        }
      } catch (error: any) {
        reject(error)
      }
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).openTBankPaymentForm = openPaymentFormMemo
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openTBankPaymentForm
      }
    }
  }, [openPaymentFormMemo])

  return null // Компонент не рендерит ничего видимого
}
