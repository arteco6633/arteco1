'use client'

import { useEffect, useState, useRef, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number | null
  image_url: string
  images?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
}

interface Interior {
  id: number
  title: string
  subtitle?: string | null
  description?: string | null
  cover_image: string
  cover_preview?: string | null
  gallery_images?: string[] | null
  gallery_previews?: string[] | null
  video_urls?: string[] | null
  document_files?: { url: string; name?: string | null }[] | null
  location?: string | null
  area?: string | null
  style?: string | null
  created_at?: string
}

export default function PartnersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typedTeam, setTypedTeam] = useState('')
  const [interiors, setInteriors] = useState<Interior[]>([])
  const [interiorsLoading, setInteriorsLoading] = useState(true)
  const [activeInteriorIndex, setActiveInteriorIndex] = useState<number | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isModalAnimatedIn, setIsModalAnimatedIn] = useState(false)
  const [displayedMediaIndex, setDisplayedMediaIndex] = useState(0)
  const [isMediaEntering, setIsMediaEntering] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const isMountedRef = useRef(true)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [thumbnailOffset, setThumbnailOffset] = useState(0)
  const MAX_VISIBLE_THUMBS = 5
  const touchStartXRef = useRef<number | null>(null)
  const touchCurrentXRef = useRef<number | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const mediaTransitionTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    loadProducts()
    loadWishlistProducts()
    loadInteriors()
  }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if (closeTimeoutRef.current !== null) {
          window.clearTimeout(closeTimeoutRef.current)
        }
        if (mediaTransitionTimeoutRef.current !== null) {
          window.clearTimeout(mediaTransitionTimeoutRef.current)
        }
      }
    }
  }, [])

  // Typewriter animation for "team"
  useEffect(() => {
    isMountedRef.current = true
    const fullText = 'team'
    let currentIndex = 0
    let isDeleting = false
    let typingSpeed = 100
    const timeouts: NodeJS.Timeout[] = []
    let cancelled = false

    const type = () => {
      if (cancelled || !isMountedRef.current) return

      try {
        if (!isDeleting && currentIndex <= fullText.length) {
          if (isMountedRef.current && !cancelled) {
            setTypedTeam(fullText.substring(0, currentIndex))
          }
          currentIndex++
          typingSpeed = 100
        } else if (isDeleting && currentIndex >= 0) {
          if (isMountedRef.current && !cancelled) {
            setTypedTeam(fullText.substring(0, currentIndex))
          }
          currentIndex--
          typingSpeed = 50
        }

        if (currentIndex === fullText.length + 1) {
          // Пауза перед началом удаления
          typingSpeed = 2000
          isDeleting = true
        } else if (currentIndex === -1) {
          // Пауза перед началом печатания
          typingSpeed = 500
          isDeleting = false
          currentIndex = 0
        }

        if (isMountedRef.current && !cancelled) {
          const timeoutId = setTimeout(type, typingSpeed) as NodeJS.Timeout
          timeouts.push(timeoutId)
        }
      } catch (error) {
        // Игнорируем ошибки при переводе страницы
        console.warn('Animation error (ignored):', error)
      }
    }

    type()

    // Обработчик изменения языка/перевода
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelled = true
        timeouts.forEach(timeout => clearTimeout(timeout))
      }
    }

    const handleLanguageChange = () => {
      cancelled = true
      timeouts.forEach(timeout => clearTimeout(timeout))
    }

    // Обработчик изменения DOM (для переводчика браузера)
    const observer = new MutationObserver((mutations) => {
      // Проверяем, не является ли изменение результатом работы переводчика
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'translate' || mutation.attributeName === 'lang')) {
          cancelled = true
          timeouts.forEach(timeout => clearTimeout(timeout))
          return
        }
        // Проверяем добавление элементов с атрибутом translate
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && 
                ((node as Element).hasAttribute('translate') || 
                 (node as Element).querySelector('[translate]'))) {
              cancelled = true
              timeouts.forEach(timeout => clearTimeout(timeout))
              return
            }
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['translate', 'lang']
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleLanguageChange)

    return () => {
      cancelled = true
      isMountedRef.current = false
      timeouts.forEach(timeout => clearTimeout(timeout))
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleLanguageChange)
    }
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(6)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadWishlistProducts() {
    try {
      const wishlistNames = ['Комод Вегас', 'Кровать Лона', 'Кухня Мона Лиза']
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('name', wishlistNames)

      if (error) throw error
      
      // Сортируем в нужном порядке
      const sortedProducts = wishlistNames
        .map(name => data?.find(p => p.name === name))
        .filter(Boolean) as Product[]
      
      setWishlistProducts(sortedProducts)
    } catch (error) {
      console.error('Ошибка загрузки товаров вишлиста:', error)
    }
  }

  async function loadInteriors() {
    try {
      setInteriorsLoading(true)
      const { data, error } = await supabase
        .from('client_interiors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInteriors(data || [])
    } catch (error) {
      console.error('Ошибка загрузки интерьеров клиентов:', error)
      setInteriors([])
    } finally {
      setInteriorsLoading(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  const topProducts = products.slice(0, 4)
  const recommendedProducts = wishlistProducts.length > 0 ? wishlistProducts.slice(0, 4) : topProducts
  const totalPrice = recommendedProducts.reduce((sum, product) => sum + product.price, 0)
  const averagePrice = recommendedProducts.length ? Math.round(totalPrice / recommendedProducts.length) : null
  const newProductsCount = recommendedProducts.filter(product => product.is_new).length
  const maxPrice = recommendedProducts.reduce((max, product) => Math.max(max, product.price), 0)
  const minPrice = recommendedProducts.length > 0
    ? recommendedProducts.reduce((min, product) => Math.min(min, product.price), Infinity)
    : 0
  const priceRange = maxPrice - minPrice
  const chartWidth = 110
  const chartHeight = 60
  const chartPaddingX = 10
  const chartPaddingTop = 6
  const chartPaddingBottom = 12
  const chartHorizontalStep = recommendedProducts.length > 1
    ? (chartWidth - chartPaddingX * 2) / (recommendedProducts.length - 1)
    : 0
  const chartPoints = recommendedProducts.map((product, index) => {
    const normalizedValue = priceRange > 0 ? (product.price - minPrice) / priceRange : 0.5
    const x = recommendedProducts.length > 1
      ? chartPaddingX + index * chartHorizontalStep
      : chartWidth / 2
    const y = chartHeight - chartPaddingBottom - normalizedValue * (chartHeight - chartPaddingTop - chartPaddingBottom)
    const baseLabel = (product.name?.split(' ')[0] ?? product.name ?? '').trim()
    const cleanedLabel = baseLabel.length > 0 ? baseLabel : 'Товар'
    const label = cleanedLabel.slice(0, 9)
    return { x, y, label, key: product.id ?? index }
  })
  const hasTrend = chartPoints.length > 1
  const chartAreaPath = hasTrend
    ? `M ${chartPoints[0].x},${chartHeight - chartPaddingBottom} ${chartPoints
        .map(point => `L ${point.x},${point.y}`)
        .join(' ')} L ${chartPoints[chartPoints.length - 1].x},${chartHeight - chartPaddingBottom} Z`
    : ''
  const chartPolylinePoints = hasTrend
    ? chartPoints.map(point => `${point.x},${point.y}`).join(' ')
    : ''

  const activeInterior = activeInteriorIndex !== null ? interiors[activeInteriorIndex] : null
  type InteriorMediaItem = { type: 'image' | 'video'; url: string; preview?: string | null }
  const activeInteriorMedia = activeInterior
    ? [
        activeInterior.cover_image
          ? { type: 'image' as const, url: activeInterior.cover_image, preview: activeInterior.cover_preview ?? null }
          : null,
        ...(activeInterior.gallery_images?.map((url, index) => ({
          type: 'image' as const,
          url,
          preview: activeInterior.gallery_previews?.[index] ?? null,
        })) ?? []),
      ].filter(Boolean) as InteriorMediaItem[]
    : []
  const imageMedia = activeInteriorMedia.filter((media) => media.type === 'image')
  const videoMedia: InteriorMediaItem[] = activeInterior?.video_urls?.map((url) => ({ type: 'video', url })) ?? []
  const isGalleryModalOpen = isModalVisible && activeInteriorIndex !== null
  const activeMediaItem = imageMedia[displayedMediaIndex] ?? null
  const maxThumbnailOffset = Math.max(0, imageMedia.length - MAX_VISIBLE_THUMBS)
  const visibleThumbnails = imageMedia.slice(thumbnailOffset, thumbnailOffset + MAX_VISIBLE_THUMBS)

  useEffect(() => {
    if (activeMediaIndex >= imageMedia.length) {
      setActiveMediaIndex(0)
    }
  }, [activeMediaIndex, imageMedia.length])

  useEffect(() => {
    if (activeMediaIndex < thumbnailOffset) {
      setThumbnailOffset(activeMediaIndex)
    } else if (activeMediaIndex >= thumbnailOffset + MAX_VISIBLE_THUMBS) {
      setThumbnailOffset(Math.min(activeMediaIndex - MAX_VISIBLE_THUMBS + 1, maxThumbnailOffset))
    }
  }, [activeMediaIndex, thumbnailOffset, MAX_VISIBLE_THUMBS, maxThumbnailOffset])

  useEffect(() => {
    if (activeVideoIndex >= videoMedia.length) {
      setActiveVideoIndex(0)
    }
  }, [activeVideoIndex, videoMedia.length])

  useEffect(() => {
    if (!isGalleryModalOpen) {
      if (typeof window !== 'undefined' && mediaTransitionTimeoutRef.current !== null) {
        window.clearTimeout(mediaTransitionTimeoutRef.current)
        mediaTransitionTimeoutRef.current = null
      }
      setDisplayedMediaIndex(activeMediaIndex)
      setIsMediaEntering(true)
      return
    }

    if (typeof window === 'undefined') {
      setDisplayedMediaIndex(activeMediaIndex)
      setIsMediaEntering(true)
      return
    }

    setIsMediaEntering(false)
    const timeoutId = window.setTimeout(() => {
      setDisplayedMediaIndex(activeMediaIndex)
      setIsMediaEntering(true)
      mediaTransitionTimeoutRef.current = null
    }, 180)

    mediaTransitionTimeoutRef.current = timeoutId

    return () => {
      if (typeof window !== 'undefined') {
        window.clearTimeout(timeoutId)
      }
      if (mediaTransitionTimeoutRef.current === timeoutId) {
        mediaTransitionTimeoutRef.current = null
      }
    }
  }, [activeMediaIndex, isGalleryModalOpen])

  useEffect(() => {
    if (isModalVisible) {
      const activate = () => setIsModalAnimatedIn(true)
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(activate)
      } else {
        activate()
      }
    } else {
      setIsModalAnimatedIn(false)
    }
  }, [isModalVisible])

  function openInterior(index: number) {
    if (typeof window !== 'undefined') {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (mediaTransitionTimeoutRef.current !== null) {
        window.clearTimeout(mediaTransitionTimeoutRef.current)
        mediaTransitionTimeoutRef.current = null
      }
    }

    setActiveInteriorIndex(index)
    setActiveMediaIndex(0)
    setDisplayedMediaIndex(0)
    setIsMediaEntering(true)
    setActiveVideoIndex(0)
    setThumbnailOffset(0)
    touchStartXRef.current = null
    touchCurrentXRef.current = null
    setIsModalAnimatedIn(false)
    setIsModalVisible(true)
  }

  function closeInterior() {
    if (!isModalVisible) {
      return
    }

    setIsModalAnimatedIn(false)

    if (typeof window !== 'undefined' && mediaTransitionTimeoutRef.current !== null) {
      window.clearTimeout(mediaTransitionTimeoutRef.current)
      mediaTransitionTimeoutRef.current = null
    }

    const finalize = () => {
      setIsModalVisible(false)
      setActiveInteriorIndex(null)
      setActiveMediaIndex(0)
      setDisplayedMediaIndex(0)
      setIsMediaEntering(true)
      setActiveVideoIndex(0)
      setThumbnailOffset(0)
      touchStartXRef.current = null
      touchCurrentXRef.current = null
    }

    if (typeof window !== 'undefined') {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
      closeTimeoutRef.current = window.setTimeout(() => {
        finalize()
        closeTimeoutRef.current = null
      }, 360)
    } else {
      finalize()
    }
  }

  function showNextMedia() {
    if (imageMedia.length <= 1) return
    setActiveMediaIndex((prev) => (prev + 1) % imageMedia.length)
  }

  function showPrevMedia() {
    if (imageMedia.length <= 1) return
    setActiveMediaIndex((prev) => (prev - 1 + imageMedia.length) % imageMedia.length)
  }

  function selectMedia(index: number) {
    if (index < 0 || index >= imageMedia.length) return
    setActiveMediaIndex(index)
  }

  function shiftThumbnails(direction: 'up' | 'down') {
    if (direction === 'up') {
      setThumbnailOffset((prev) => Math.max(0, prev - 1))
    } else {
      setThumbnailOffset((prev) => Math.min(maxThumbnailOffset, prev + 1))
    }
  }

  useEffect(() => {
    if (!isModalVisible) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeInterior()
        return
      }
      if (event.key === 'ArrowRight' && imageMedia.length > 1) {
        event.preventDefault()
        setActiveMediaIndex((prev) => (prev + 1) % imageMedia.length)
      }
      if (event.key === 'ArrowLeft' && imageMedia.length > 1) {
        event.preventDefault()
        setActiveMediaIndex((prev) => (prev - 1 + imageMedia.length) % imageMedia.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalVisible, imageMedia.length])

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    if (imageMedia.length <= 1) return
    if (e.touches.length > 1) return
    touchStartXRef.current = e.touches[0].clientX
    touchCurrentXRef.current = null
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (imageMedia.length <= 1) return
    if (e.touches.length > 1) return
    touchCurrentXRef.current = e.touches[0].clientX
  }

  function handleTouchEnd() {
    if (imageMedia.length <= 1) return
    const start = touchStartXRef.current
    const current = touchCurrentXRef.current
    if (start === null || current === null) {
      touchStartXRef.current = null
      touchCurrentXRef.current = null
      return
    }
    const delta = current - start
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        showPrevMedia()
      } else {
        showNextMedia()
      }
    }
    touchStartXRef.current = null
    touchCurrentXRef.current = null
  }

  return (
    <div className="min-h-screen w-full modern-2025-bg overflow-x-hidden m-0 p-0">
      {/* Hero Section - Minimalist */}
      <section className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-gray-100/50 z-10">
        {/* Content */}
        <div className="relative z-10 max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 sm:py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 border border-gray-300 bg-white rounded-[50px]">
            <span className="text-xs tracking-[0.2em] uppercase text-gray-600 font-medium">Партнёрская программа</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-black mb-6 sm:mb-8 leading-[1.1] tracking-tight">
            arteco.<span className="relative inline-block">{typedTeam}<span className="inline-block w-[2px] h-[0.9em] bg-black ml-1.5 animate-blink align-bottom" suppressHydrationWarning></span></span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 sm:mb-12 max-w-none mx-auto font-light tracking-wide whitespace-nowrap overflow-x-auto">
            Реализуем дизайн вместе
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20">
            <Link
              href="/partners/register"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-sm sm:text-base tracking-wide hover:bg-gray-900 transition-colors duration-200 uppercase tracking-[0.1em] rounded-[50px] animate-subtle-glow animate-soft-breath w-full sm:w-auto"
            >
              Стать партнером
            </Link>
            <Link
              href="/partners/login"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-white text-black font-normal text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-all duration-200 uppercase tracking-[0.1em] rounded-[50px] animate-border-pulse animate-soft-breath w-full sm:w-auto"
            >
              Войти в кабинет
            </Link>
          </div>

          {/* Stats - Minimalist - Empty block to maintain spacing */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 md:gap-12 max-w-2xl mx-auto mt-12 sm:mt-16 md:mt-24 pt-6 sm:pt-8 md:pt-12">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Minimalist */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50 relative">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Cards - Left */}
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
            {/* Benefit 1 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-light text-black mb-1 sm:mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Комиссия 10%</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Получайте 10% комиссии с каждого заказа, который вы привели. Выплаты производятся ежемесячно
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-light text-black mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Сопровождение клиента</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Мы полностью сопровождаем вашего клиента на каждом этапе: от консультации до доставки и сборки
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-light text-black mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Личный кабинет</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Отслеживайте статус заказов ваших клиентов, статистику и начисленные комиссии в реальном времени
                  </p>
                </div>
              </div>
            </div>
              </div>
            </div>

            {/* Text - Right */}
            <div className="relative order-1 lg:order-2 lg:pl-8 mb-8 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                ARTECO.<span className="relative inline-block">{typedTeam}<span className="inline-block w-[2px] h-[0.9em] bg-black ml-1.5 animate-blink align-bottom" suppressHydrationWarning></span></span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed">
                Выгодные условия для партнёров с прозрачной системой выплат
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Account Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Text - Left */}
            <div className="relative order-1 lg:order-1 lg:pr-8 mb-8 lg:mb-0 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                Кабинет партнера
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-8">
                Отслеживайте статус и комисси в реальном времени
              </p>
            </div>

            {/* Dashboard Preview - Right */}
            <div className="relative order-2 lg:order-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 font-light">Заказов</div>
                    <div className="text-xl sm:text-2xl font-light text-black">24</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 font-light">Комиссия</div>
                    <div className="text-xl sm:text-2xl font-light text-black">125,000₽</div>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm font-light text-gray-600 mb-2 sm:mb-3">Последние заказы</div>
                  {[
                    { id: '#12345', status: 'Оплачен', amount: '45,000₽', date: '12.01.2025' },
                    { id: '#12344', status: 'В обработке', amount: '32,000₽', date: '11.01.2025' },
                    { id: '#12343', status: 'Доставлен', amount: '28,000₽', date: '10.01.2025' },
                  ].map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                          <span className="text-xs sm:text-sm font-light text-black truncate">{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-light flex-shrink-0 ${
                            order.status === 'Оплачен' ? 'bg-green-100 text-green-700' :
                            order.status === 'В обработке' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-light">{order.date}</div>
                      </div>
                      <div className="text-xs sm:text-sm font-light text-black ml-2 flex-shrink-0">{order.amount}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-xs sm:text-sm font-light text-gray-600 mb-2 sm:mb-3">Статистика за месяц</div>
                  <div className="h-24 sm:h-28 md:h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-end justify-around p-2 sm:p-3 md:p-4">
                    {[40, 65, 45, 80, 55, 70, 60].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-black rounded-t-sm transition-all duration-300 hover:bg-gray-700"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-light">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Wishlist Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Wishlist Share Preview - Left */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Wishlist Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.312-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-light text-black truncate">Мой вишлист</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-light">5 товаров</div>
                    </div>
                  </div>
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white text-[10px] sm:text-xs font-light rounded-full hover:bg-gray-800 transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />
                    </svg>
                    Поделиться
                  </button>
                </div>

                {/* Wishlist Items */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {wishlistProducts.length > 0 ? (
                    wishlistProducts.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized={item.image_url?.includes('unsplash') || false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-light text-black truncate">{item.name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-light">{formatPrice(item.price)} ₽</div>
                        </div>
                        <button className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    // Fallback если товары еще не загружены
                    ['Комод Вегас', 'Кровать Лона', 'Кухня Мона Лиза'].map((name, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-light text-black truncate">{name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-light">Загрузка...</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Share Options */}
                <div className="pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-light mb-2 sm:mb-3">Поделиться через:</div>
                  <div className="flex flex-wrap gap-2">
                    {['WhatsApp', 'Telegram', 'Email', 'Копировать'].map((platform, index) => (
                      <button key={index} className="flex-1 min-w-[calc(50%-4px)] sm:min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-xs font-light text-black hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200">
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text - Right */}
            <div className="relative order-1 lg:order-2 lg:pl-8 mb-8 lg:mb-0 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                Вишлист клиентам
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-8">
                Создавайте списки желаний и делитесь ими с клиентами
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products Visualization */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-start">
            {/* Insight - Left */}
            <div className="relative order-1 lg:order-1 lg:pr-8 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                Популярные товары
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-10">
                Посмотрите, какие позиции рекомендуют партнёры чаще всего и как меняется спрос в реальном времени
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
                <div className="rounded-2xl bg-black text-white p-4 sm:p-6 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-4">Средняя стоимость</span>
                  <span className="text-2xl sm:text-3xl font-light">
                    {averagePrice !== null ? `${formatPrice(averagePrice)} ₽` : '—'}
                  </span>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 sm:p-6 bg-white/60 backdrop-blur flex flex-col justify-between">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mb-4">Новинки в топе</span>
                  <span className="text-2xl sm:text-3xl font-light text-black">
                    {newProductsCount > 0 ? newProductsCount : 'Нет'}
                  </span>
                </div>
              </div>

              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-xs sm:text-sm uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors duration-200 rounded-[50px]"
              >
                <span>Перейти в каталог</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Visualization - Right */}
            <div className="relative order-2 lg:order-2 mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mb-1">Визуализация каталога</div>
                    <div className="text-lg sm:text-xl font-light text-black">Топ рекомендации</div>
                    </div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] sm:text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="animate-pulse flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-10 h-3 bg-gray-200 rounded flex-shrink-0"></div>
                      </div>
                    ))
                  ) : recommendedProducts.length > 0 ? (
                    recommendedProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized={product.image_url?.includes('unsplash') || false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                            </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs sm:text-sm font-light text-black truncate">{product.name}</span>
                            <span className="text-[10px] sm:text-xs text-gray-400 font-light">#{String(index + 1).padStart(2, '0')}</span>
                      </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-light truncate">
                            {product.description || 'Описание появится скоро'}
                    </div>
                </div>
                        <div className="text-xs sm:text-sm font-light text-black flex-shrink-0 whitespace-nowrap">
                          {formatPrice(product.price)} ₽
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
                      Товары появятся здесь, когда они будут доступны
                    </div>
                  )}
                </div>

                <div className="pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-light mb-2 sm:mb-3 uppercase tracking-[0.2em]">Динамика интереса</div>
                  <div className="h-24 sm:h-28 md:h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 sm:p-3 md:p-4">
                    {(!loading && chartPoints.length > 0) ? (
                      <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="popularTrendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1f2937" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line
                          x1={chartPaddingX}
                          y1={chartHeight - chartPaddingBottom}
                          x2={chartWidth - chartPaddingX}
                          y2={chartHeight - chartPaddingBottom}
                          stroke="#e5e7eb"
                          strokeWidth="0.6"
                          strokeLinecap="round"
                        />
                        {chartAreaPath && (
                          <path
                            d={chartAreaPath}
                            fill="url(#popularTrendGradient)"
                          />
                        )}
                        {chartPolylinePoints && (
                          <polyline
                            points={chartPolylinePoints}
                            fill="none"
                            stroke="#1f2937"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        {chartPoints.map((point) => (
                          <circle key={`point-${point.key}`} cx={point.x} cy={point.y} r="1.8" fill="#1f2937" />
                        ))}
                        {chartPoints.map((point) => {
                          const label = point.label.length > 8 ? `${point.label.slice(0, 7)}…` : point.label
                          return (
                            <text
                              key={`label-${point.key}`}
                              x={point.x}
                              y={chartHeight - chartPaddingBottom + 7.5}
                              textAnchor="middle"
                              fontSize="5"
                              fill="#a0aec0"
                              fontWeight="400"
                            >
                              {label.toUpperCase()}
                            </text>
                          )
                        })}
                      </svg>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-light">
                        Данные появятся позже
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-0 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 px-4 sm:px-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-4 sm:mb-6 tracking-tight">
              Интерьеры наших клиентов
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto.font-light">
              Вдохновитесь реальными примерами кухонь, созданных с любовью
            </p>
          </div>

          {interiorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] overflow-hidden rounded-[30px] border border-gray-200/70 bg-gradient-to-br from-gray-100 via-gray-50 to-white animate-pulse"
                >
                  <div className="absolute inset-4 rounded-[26px] border border-dashed border-gray-200" />
            </div>
              ))}
            </div>
          ) : interiors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
              {interiors.map((interior, index) => (
                <button
                  type="button"
                  key={interior.id}
                  onClick={() => openInterior(index)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[30px] border border-gray-200 bg-gray-50 text-left transition-all duration-500 hover:-translate-y-1 hover:border-gray-300.hover:shadow-[0_32px_90px_-45px_rgба(15,23,42,0.55)] focus:outline-none focus-visible:ring-2.focus-visible:ring-black focus-visible:ring-offset-4"
                >
                  {interior.cover_image ? (
                    <Image
                      src={interior.cover_image}
                      alt={interior.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized={interior.cover_image?.includes('unsplash.com') || false}
                      priority={index < 3}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                      Изображение готовится
                      </div>
                    )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                  <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-white/85 text-[10px] sm:text-xs tracking-[0.4em] text-gray-700 shadow-sm">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {(interior.video_urls?.length || interior.document_files?.length) && (
                    <div className="absolute top-5 right-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-white/80">
                      {interior.video_urls?.length ? (
                        <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z" />
                          </svg>
                          {interior.video_urls.length}
                      </span>
                      ) : null}
                      {interior.document_files?.length ? (
                        <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4.5a2.5 2.5 0 012.5 2.5V21" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v12a2 2 0 002 2h8" />
                          </svg>
                          {interior.document_files.length}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-2">
                      Квартира · Проект
                  </div>
                    <div className="text-lg sm:text-xl font-light text-white leading-tight line-clamp-2">
                      {interior.title}
                    </div>
                    {(interior.location || interior.subtitle) && (
                      <div className="mt-2 text-[11px] sm:text-xs text-white/70 tracking-wide">
                        {interior.location || interior.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 py-16 px-6 text-center text-sm sm:text-base text-gray-500">
              Добавьте реальные интерьеры через админ-панель, чтобы вдохновлять партнёров и их клиентов.
            </div>
          )}
        </div>
      </section>

      {isModalVisible && activeInterior && isMounted
        ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-0 py-4 sm:px-4 sm:py-6">
          <button
            type="button"
            aria-label="Закрыть просмотр интерьера"
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400 ease-out ${
              isModalAnimatedIn ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeInterior}
          />
          <div
            className={`relative z-10 w-full h-full max-h-none overflow-hidden rounded-none sm:rounded-[32px] bg-white shadow-[0_40px_140px_-60px_rgba(15,23,42,0.65)] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
              isModalAnimatedIn
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-6 sm:translate-y-4 scale-[0.97]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 sm:px-8 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-gray-400 mb-1">Проект</div>
                <h3 className="text-xl sm:text-2xl font-light text-gray-900 leading-tight">{activeInterior.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeInterior}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="Закрыть"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              </button>
          </div>

            <div className="h-[calc(100vh-120px)] overflow-y-auto px-4 pt-4 pb-16 sm:px-8 sm:pt-8 sm:pb-16 space-y-6">
              <div>
                <div className="lg:flex lg:gap-4">
                  {imageMedia.length > 1 && (
                    <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:pr-4">
                      <button
                        type="button"
                        disabled={thumbnailOffset === 0}
                        onClick={() => shiftThumbnails('up')}
                        className={`h-8 w-36 rounded-full border text-xs uppercase tracking-[0.2em] transition ${
                          thumbnailOffset === 0
                            ? 'cursor-not-allowed border-gray-200 text-gray-300'
                            : 'border-gray-300 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        ↑
                      </button>
                      {visibleThumbnails.map((media, idx) => {
                        const realIndex = idx + thumbnailOffset
                        return (
                          <button
                            type="button"
                            key={`${media.type}-${media.url}-${realIndex}`}
                            onClick={() => selectMedia(realIndex)}
                            className={`relative h-20 w-36 overflow-hidden rounded-2xl border transition-all.duration-200 ${
                              realIndex === activeMediaIndex
                                ? 'border-gray-900 ring-2 ring-gray-900/40 shadow-lg'
                                : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={media.preview || media.url}
                              alt={`Превью ${realIndex + 1}`}
                              fill
                              className="object-cover"
                              sizes="144px"
                              unoptimized={(media.preview || media.url)?.includes('unsplash.com') || false}
                            />
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        disabled={thumbnailOffset >= maxThumbnailOffset}
                        onClick={() => shiftThumbnails('down')}
                        className={`h-8 w-36 rounded-full border text-xs uppercase tracking-[0.2em] transition ${
                          thumbnailOffset >= maxThumbnailOffset
                            ? 'cursor-not-allowed border-gray-200 text-gray-300'
                            : 'border-gray-300 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        ↓
                      </button>
        </div>
                  )}
                  <div
                    className="relative flex-1 h-[300px] sm:h-[380px] md:h-[460px] lg:h-[620px] xl:h-[720px] 2xl:h-[780px] overflow-hidden rounded-[28px] bg-gray-100"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      key={`${activeInterior?.id ?? 'modal'}-${displayedMediaIndex}`}
                      className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isMediaEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.98]'
                      }`}
                    >
                      {activeMediaItem ? (
                        activeMediaItem.type === 'video' ? (
                          <video
                            key={`${activeMediaItem.url}-${displayedMediaIndex}`}
                            src={activeMediaItem.url}
                            controls
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="relative h-full w-full">
                            <Image
                              key={`${activeMediaItem.url}-${displayedMediaIndex}`}
                              src={activeMediaItem.url}
                              alt={activeInterior.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 60vw"
                              unoptimized={activeMediaItem.url?.includes('unsplash.com') || false}
                            />
                          </div>
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                          Медиа временно недоступно
                        </div>
                      )}
                    </div>

                    {imageMedia.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPrevMedia}
                          aria-label="Предыдущее медиа"
                          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={showNextMedia}
                          aria-label="Следующее медиа"
                          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
          </div>

                {imageMedia.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2 lg:hidden snap-x snap-mandatory">
                    {imageMedia.map((media, index) => (
                      <button
                        type="button"
                        key={`${media.type}-${media.url}-${index}`}
                        onClick={() => selectMedia(index)}
                        className={`relative h-16 w-24 flex-shrink-0 overflow-hidden.rounded-2xl border transition-all duration-200 snap-start ${
                          index === activeMediaIndex
                            ? 'border-gray-900 ring-2 ring-gray-900/40 shadow-lg'
                            : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                        }`}
              >
                <Image
                          src={media.preview || media.url}
                          alt={`Превью ${index + 1}`}
                  fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, 96px"
                          unoptimized={(media.preview || media.url)?.includes('unsplash.com') || false}
                />
                      </button>
                    ))}
              </div>
                )}
              </div>

              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10 lg:items-stretch">
                {videoMedia.length > 0 && (
                  <div className="space-y-4 flex flex-col">
                     <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400">Видео проекта</div>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm h-[240px] sm:h-[360px] md:h-[400px] lg:h-[460px] xl:h-[500px]">
                       <video
                         key={`${videoMedia[activeVideoIndex]?.url}-${activeVideoIndex}`}
                         src={videoMedia[activeVideoIndex]?.url}
                         controls
                         playsInline
                        className="w-full h-full object-cover"
                       />
                     </div>
                     {videoMedia.length > 1 && (
                       <div className="flex flex-wrap gap-2 pt-2">
                         {videoMedia.map((media, index) => (
                           <button
                             key={`${media.url}-${index}`}
                             onClick={() => setActiveVideoIndex(index)}
                             className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                               index === activeVideoIndex
                                 ? 'border-gray-900 bg-gray-900 text-white'
                                 : 'border-gray-200 text-gray-500 hover:border-gray-300'
                             }`}
                           >
                             Видео {index + 1}
                           </button>
            ))}
          </div>
                     )}
        </div>
                   )}

                <div className="space-y-5 flex flex-col h-full">
                   {activeInterior.subtitle && (
                     <p className="text-sm text-gray-500 leading-relaxed">
                       {activeInterior.subtitle}
                     </p>
                   )}

                   {activeInterior.description && (
                     <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                       {activeInterior.description}
                     </p>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {activeInterior.location && (
                       <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                         <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Локация</div>
                         <div className="text-sm text-gray-700">{activeInterior.location}</div>
                       </div>
                     )}
                     {activeInterior.area && (
                       <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                         <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Площадь</div>
                         <div className="text-sm text-gray-700">{activeInterior.area}</div>
                       </div>
                     )}
                     {activeInterior.style && (
                       <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                         <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Стиль</div>
                         <div className="text-sm text-gray-700">{activeInterior.style}</div>
                       </div>
                     )}
                   </div>

                   {activeInterior.document_files?.length ? (
                     <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                       <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">Материалы проекта</div>
                       <div className="space-y-2">
                         {activeInterior.document_files.map((doc, index) => (
                           <a
                             key={`${doc.url}-${index}`}
                             href={doc.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                           >
                             <span className="flex items-center gap-2">
                               <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10a4 4 0 004 4h6" />
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4a4 4 0 014 4v10" />
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.5V7" />
                               </svg>
                               <span>{doc.name || `Файл ${index + 1}`}</span>
                             </span>
                             <span className="text-xs uppercase tracking-[0.3em] text-gray-400">PDF</span>
                           </a>
                         ))}
                       </div>
                     </div>
                   ) : null}

                   <div className="mt-auto rounded-[28px] bg-gray-900 px-5 py-6 text-white shadow-[0_18px_48px_-28px_rgba(15,23,42,0.8)]">
                     <div className="text-[10px] uppercase tracking-[0.35ем] text-white/50 mb-2">Для партнёров</div>
                     <p className="text-sm leading-relaxed text-white/80">
                       Хотите показать клиенту похожий проект? Запросите наш менеджмент, указав ID #{activeInterior.id}. Мы подготовим подборку материалов и смету.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* Final CTA Section - Minimalist */}
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 py-12 sm:py-16 md:py-20 lg:py-24 bg-black text-white">
        <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-8 tracking-tight">
            Готовы стать партнёром?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto font-light text-gray-300 px-4">
            Присоединяйтесь к партнёрской программе ARTECO и получайте комиссию с каждого заказа
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20">
            <Link
              href="/partners/register"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-white text-black font-normal text-xs sm:text-sm uppercase tracking-[0.1em] hover:bg-gray-100 transition-colors duration-200 rounded-[50px] animate-border-pulse animate-soft-breath w-full sm:w-auto"
            >
              Стать партнером сейчас
            </Link>
            <Link
              href="/partners/login"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-xs sm:text-sm uppercase tracking-[0.1em] border border-white hover:bg-white hover:text-black transition-all duration-200 rounded-[50px] animate-subtle-glow animate-soft-breath w-full sm:w-auto"
            >
              Войти в кабинет
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-3xl mx-auto pt-8 sm:pt-10 md:pt-12 border-t border-gray-800">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">10%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Комиссия с заказа</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">0₽</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Стоимость участия</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">∞</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Без ограничений</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
