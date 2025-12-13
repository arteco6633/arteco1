'use client'

import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    // Показываем кастомный курсор только на десктопе
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
    if (isMobile) return

    // Скрываем стандартный курсор
    document.body.style.cursor = 'none'

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsHidden(false)
    }

    const handleMouseEnter = () => setIsHidden(false)
    const handleMouseLeave = () => setIsHidden(true)
    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    // Проверяем, наведен ли курсор на кликабельный элемент
    const checkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.closest('[role="button"]') !== null ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer' ||
        window.getComputedStyle(target).cursor === 'grab' ||
        window.getComputedStyle(target).cursor === 'grabbing'

      setIsHovering(isInteractive)
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mousemove', checkHover)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mousemove', checkHover)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Не рендерим на мобильных устройствах
  const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768)
  if (isMobile) return null

  return (
    <>
      {/* Основной курсор */}
      <div
        className={`custom-cursor ${isHidden ? 'hidden' : ''}`}
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      >
        <div
          className={`custom-cursor-dot ${isHovering ? 'hover' : ''} ${isClicking ? 'clicking' : ''}`}
        />
      </div>
      
      {/* Внешний круг (для плавного эффекта) */}
      <div
        className={`custom-cursor-ring ${isHidden ? 'hidden' : ''}`}
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      >
        <div
          className={`custom-cursor-ring-inner ${isHovering ? 'hover' : ''} ${isClicking ? 'clicking' : ''}`}
        />
      </div>
    </>
  )
}

