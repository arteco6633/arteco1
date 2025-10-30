"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname
      return
    }
    // Путь изменился → показать оверлей на короткое время
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      setVisible(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      // Минимальная длительность, чтобы было заметно; автоматически исчезает
      timerRef.current = setTimeout(() => setVisible(false), 600)
    }
  }, [pathname])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[999] bg-white/95 backdrop-blur-[2px] grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-bold tracking-wide">ART × CO</div>
        <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" aria-label="loading" />
      </div>
    </div>
  )
}


