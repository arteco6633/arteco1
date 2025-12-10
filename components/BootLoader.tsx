"use client"

import { useEffect, useState } from 'react'

export default function BootLoader() {
  const [shouldHide, setShouldHide] = useState(false)

  useEffect(() => {
    // Ждем полной гидрации и загрузки критических данных
    // На медленном интернете даем больше времени
    const hideLoader = () => {
      // Проверяем, что страница действительно загружена
      if (document.readyState === 'complete') {
        setShouldHide(true)
        const el = document.getElementById('arteco-boot-loader')
        if (el) {
          el.style.opacity = '0'
          el.style.transition = 'opacity 300ms ease'
          setTimeout(() => {
            el.style.display = 'none'
          }, 320)
        }
      }
    }

    // Пробуем скрыть сразу, если уже загружено
    if (document.readyState === 'complete') {
      hideLoader()
    } else {
      window.addEventListener('load', hideLoader)
      // Fallback - скрываем максимум через 3 секунды, даже если что-то не загрузилось
      const timeout = setTimeout(hideLoader, 3000)
      
      return () => {
        window.removeEventListener('load', hideLoader)
        clearTimeout(timeout)
      }
    }
  }, [])

  return null
}


