'use client'

import { useEffect, useState, useRef } from 'react'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isHidden, setIsHidden] = useState(true)
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Показываем кастомный курсор только на десктопе
    const isMobile = typeof window !== 'undefined' && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
      window.innerWidth < 768 ||
      'ontouchstart' in window
    )
    
    if (isMobile) return

    // Скрываем стандартный курсор
    document.body.style.cursor = 'none'

    let rafId: number
    let ringX = 0
    let ringY = 0

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsHidden(false)

      // Плавное следование внешнего кольца за курсором
      const animateRing = () => {
        if (!ringRef.current) return
        
        const diffX = e.clientX - ringX
        const diffY = e.clientY - ringY
        
        ringX += diffX * 0.15
        ringY += diffY * 0.15
        
        ringRef.current.style.left = `${ringX}px`
        ringRef.current.style.top = `${ringY}px`
        
        if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
          rafId = requestAnimationFrame(animateRing)
        }
      }
      
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(animateRing)
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
        target.closest('input') !== null ||
        target.closest('textarea') !== null ||
        target.closest('select') !== null ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer' ||
        window.getComputedStyle(target).cursor === 'grab' ||
        window.getComputedStyle(target).cursor === 'grabbing'

      setIsHovering(isInteractive)
    }

    // Инициализация позиции кольца
    const initPosition = (e: MouseEvent) => {
      ringX = e.clientX
      ringY = e.clientY
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mousemove', checkHover)
    window.addEventListener('mousemove', initPosition)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mousemove', checkHover)
      window.removeEventListener('mousemove', initPosition)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Не рендерим на мобильных устройствах
  const isMobile = typeof window !== 'undefined' && (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
    window.innerWidth < 768 ||
    'ontouchstart' in window
  )
  
  if (isMobile) return null

  return (
    <>
      {/* Основной курсор (точка) */}
      <div
        ref={dotRef}
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
      
      {/* Внешний круг (для плавного эффекта с задержкой) */}
      <div
        ref={ringRef}
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

