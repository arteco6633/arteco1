"use client"

import { useEffect } from 'react'

export default function BootLoader() {
  useEffect(() => {
    const el = document.getElementById('arteco-boot-loader')
    if (!el) return
    // Плавно скрываем после гидрации
    el.style.opacity = '0'
    el.style.transition = 'opacity 200ms ease'
    const t = setTimeout(() => {
      el.style.display = 'none'
    }, 220)
    return () => clearTimeout(t)
  }, [])
  return null
}


