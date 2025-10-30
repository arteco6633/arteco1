'use client'

import Link from 'next/link'

export default function MobileBottomNav() {
  const openAuth = () => {
    window.dispatchEvent(new Event('open-auth'))
  }
  const openSearch = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    // Откладываем, чтобы избежать гонки с обработчиком клика-вне
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('arteco:toggle-search'))
      } catch {
        window.dispatchEvent(new Event('arteco:toggle-search'))
      }
    }, 0)
  }

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] z-50">
      <div className="backdrop-blur bg-white/70 border border-white/40 rounded-[50px] shadow-lg px-5 py-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <Link href="/" className="flex flex-col items-center gap-1 py-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.25 12l8.72-7.29c.61-.51 1.47-.51 2.08 0L21.75 12v7.5A2.25 2.25 0 0119.5 21h-3.75a.75.75 0 01-.75-.75V15a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v5.25c0 .414-.336.75-.75.75H4.5A2.25 2.25 0 012.25 19.5V12z"/>
            </svg>
            <span className="text-xs">Главная</span>
          </Link>
          <Link href="/catalog" className="flex flex-col items-center gap-1 py-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span className="text-xs">Каталог</span>
          </Link>
          <button onClick={openSearch} className="flex flex-col items-center gap-1 py-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="text-xs">Поиск</span>
          </button>
          <button onClick={openAuth} className="flex flex-col items-center gap-1 py-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="text-xs">Войти</span>
          </button>
        </div>
      </div>
    </div>
  )
}


