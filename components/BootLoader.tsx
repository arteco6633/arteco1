"use client"

import { useEffect, useState } from 'react'

export default function BootLoader() {
  const [shouldHide, setShouldHide] = useState(false)

  useEffect(() => {
    // КРИТИЧНО: Скрываем лоадер как можно быстрее, не дожидаясь загрузки всех данных
    // На медленном интернете это критично, чтобы пользователь видел страницу
    const hideLoader = () => {
      setShouldHide(true)
      const el = document.getElementById('arteco-boot-loader')
      if (el) {
        el.style.opacity = '0'
        el.style.transition = 'opacity 200ms ease'
        setTimeout(() => {
          el.style.display = 'none'
        }, 220)
      }
    }

    // Скрываем лоадер сразу после гидрации React (не ждем загрузки изображений/данных)
    // Это позволяет показать страницу даже на медленном интернете
    if (document.readyState === 'loading') {
      // Если DOM еще загружается, ждем DOMContentLoaded (быстрее чем 'load')
      document.addEventListener('DOMContentLoaded', hideLoader, { once: true })
    } else {
      // Если DOM уже загружен, скрываем сразу
      hideLoader()
    }

    // Fallback - обязательно скрываем через 1 секунду максимум
    // На медленном интернете это лучше чем бесконечная загрузка
    const fallbackTimeout = setTimeout(hideLoader, 1000)
    
    return () => {
      document.removeEventListener('DOMContentLoaded', hideLoader)
      clearTimeout(fallbackTimeout)
    }
  }, [])

  if (shouldHide) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-white grid place-items-center" id="arteco-boot-loader">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-bold tracking-wide">ART × CO</div>
        <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" aria-label="Загрузка" />
      </div>
    </div>
  )
}


