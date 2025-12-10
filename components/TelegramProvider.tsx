'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { initTelegramWebApp, getTelegramWebApp, isTelegramWebApp, applyTelegramTheme, type TelegramWebApp } from '@/lib/telegram'

interface TelegramContextType {
  isTelegram: boolean
  webApp: TelegramWebApp | null
  user: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    photo_url?: string
  } | null
  ready: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
  webApp: null,
  user: null,
  ready: false,
})

export function useTelegram() {
  return useContext(TelegramContext)
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isTelegram, setIsTelegram] = useState(false)
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramContextType['user']>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Проверяем, запущено ли в Telegram
    const inTelegram = isTelegramWebApp()
    setIsTelegram(inTelegram)

    if (inTelegram) {
      // Инициализируем Telegram Web App
      const tg = initTelegramWebApp()
      if (tg) {
        setWebApp(tg)
        
        // Получаем пользователя
        const tgUser = tg.initDataUnsafe.user
        if (tgUser) {
          setUser(tgUser)
        }

        // Применяем тему Telegram
        applyTelegramTheme()

        // Слушаем изменения темы
        tg.onEvent('themeChanged', applyTelegramTheme)

        // Слушаем изменения viewport (только если метод доступен)
        if (typeof tg.onViewportChanged === 'function') {
          tg.onViewportChanged(() => {
            // Обновляем при необходимости
          })
        }

        setReady(true)
      }
    } else {
      setReady(true)
    }

    return () => {
      if (webApp) {
        webApp.offEvent('themeChanged', applyTelegramTheme)
      }
    }
  }, [])

  return (
    <TelegramContext.Provider value={{ isTelegram, webApp, user, ready }}>
      {children}
    </TelegramContext.Provider>
  )
}

