"use client"

import { useEffect, useRef, useState } from 'react'

// Показывает лёгкий оверлей при коротких ("микро") загрузках: любые fetch'и на клиенте
export default function NetworkLoader() {
  const [visible, setVisible] = useState(false)
  const inflightRef = useRef(0)
  const showTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const patchedRef = useRef(false)

  useEffect(() => {
    if (patchedRef.current) return
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return
    patchedRef.current = true

    const originalFetch = window.fetch.bind(window)
    const IGNORE = [
      /_next\//, // статика/реквесты next
      /sockjs|webpack|hmr|eventsource/i, // дев-сервер
      /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i,
    ]

    function inc() {
      inflightRef.current += 1
      // Покажем только если дольше 120мс и нет другого активного показа
      if (!showTimerRef.current && !visible) {
        showTimerRef.current = setTimeout(() => {
          setVisible(true)
          showTimerRef.current = null
        }, 120)
      }
    }

    function dec() {
      inflightRef.current = Math.max(0, inflightRef.current - 1)
      if (inflightRef.current === 0) {
        if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null }
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setVisible(false), 120)
      }
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : (input as any)?.url || ''
        if (!IGNORE.some(r => r.test(url))) inc()
        const res = await originalFetch(input, init)
        return res
      } finally {
        const url = typeof input === 'string' ? input : (input as any)?.url || ''
        if (!IGNORE.some(r => r.test(url))) dec()
      }
    }

    return () => {
      // Ничего не восстанавливаем — перезагрузка страницы вернёт оригинал
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[998] bg-white/70 backdrop-blur-[1px] grid place-items-center pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <div className="text-2xl font-bold tracking-wide">ART × CO</div>
        <div className="w-7 h-7 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    </div>
  )
}


