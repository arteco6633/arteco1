'use client'

import { useEffect, useState, useRef, useCallback, type TouchEvent, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Динамический импорт тяжелых модальных окон - загружаются только при необходимости
const GameModal = dynamic(() => import('@/components/GameModal'), {
  ssr: false,
})
const KitchenMatchmakerQuiz = dynamic(() => import('@/components/KitchenMatchmakerQuiz'), {
  ssr: false,
})
import { supabase } from '@/lib/supabase'
import HeroBanners from '@/components/HeroBanners'
import ProductGrid from '@/components/ProductGrid'
import Categories from '@/components/Categories'

// helper: наблюдение за видимостью элемента
function useInView(ref: React.RefObject<HTMLElement>, rootMargin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setInView(entry.isIntersecting))
      },
      { root: null, rootMargin, threshold: 0.2 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, rootMargin])
  return inView
}

interface Product {
  id: number
  name: string
  description?: string | null
  price: number
  original_price?: number | null
  price_type?: 'fixed' | 'per_m2' | null
  price_per_m2?: number | null
  image_url: string
  images?: string[] | null
  colors?: any[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  model_3d_url?: string | null
}

interface Banner {
  id: number
  title: string
  description: string
  image_url: string
  video_url?: string | null
  link_url: string
  button_text: string
  position: string
  is_active: boolean
  sort_order: number
}

interface Category {
  id: number
  name: string
  slug: string
  is_active: boolean
  image_url: string | null
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

export default function HomePage() {
  const NEW_PRODUCTS_LIMIT = 8
  const [gameOpen, setGameOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [hasShownContent, setHasShownContent] = useState(false) // Флаг для показа контента сразу
  // Debug: скрытие секций через параметр ?hide=top,middle,bottom,categories,middle2,bottom2,new
  const [hideSet, setHideSet] = useState<Set<string>>(new Set())
  // Временное скрытие блока категорий (выключено)
  const debugHideCategories = false

  // ref для первого баннера (стрелка появления при скролле)
  const firstBannerRef = useState<HTMLElement | null>(null)[0] as any
  const firstBannerInView = useInView({ current: firstBannerRef } as any, '0px')

  // Интерьеры клиентов
  const [interiors, setInteriors] = useState<Interior[]>([])
  const [interiorsLoading, setInteriorsLoading] = useState(true)
  const [activeInteriorIndex, setActiveInteriorIndex] = useState<number | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [displayedMediaIndex, setDisplayedMediaIndex] = useState(0)
  const [isMediaEntering, setIsMediaEntering] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const isMountedRef = useRef(true)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [thumbnailOffset, setThumbnailOffset] = useState(0)
  const MAX_VISIBLE_THUMBS = 5
  const touchStartXRef = useRef<number | null>(null)
  const touchCurrentXRef = useRef<number | null>(null)
  const mediaTransitionTimeoutRef = useRef<number | null>(null)
  const [isVideoPortrait, setIsVideoPortrait] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [videoModalSwipeOffset, setVideoModalSwipeOffset] = useState(0)
  const [isVideoModalDragging, setIsVideoModalDragging] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const videoModalTouchStartRef = useRef<number | null>(null)
  const videoModalTouchCurrentRef = useRef<number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // КРИТИЧНО: Загружаем данные асинхронно, НЕ блокируя рендеринг страницы
    // Страница показывается сразу, данные подгружаются постепенно
    
    // Определяем скорость соединения для оптимизации загрузки
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      (connection.downlink && connection.downlink < 1.5) // Медленнее 1.5 Mbps
    )

    // Загружаем критические данные асинхронно (не блокируем UI)
    // Используем requestIdleCallback для неблокирующей загрузки
    const loadDataAsync = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => loadData(), { timeout: 500 })
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => loadData(), 100)
      }
    }

    // Небольшая задержка перед началом загрузки, чтобы страница успела отрендериться
    setTimeout(loadDataAsync, 50)
    
    // Интерьеры загружаем с еще большей задержкой на медленном интернете
    if (isSlowConnection) {
      // На медленном интернете откладываем загрузку интерьеров
      setTimeout(() => {
        loadInteriors()
      }, 3000) // Увеличена задержка для медленного интернета
    } else {
      // На быстром интернете загружаем с небольшой задержкой
      setTimeout(() => {
        loadInteriors()
      }, 1000)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const hidden = params.get('hide')?.split(',').map(s => s.trim()) || []
    setHideSet(new Set(hidden))
  }, [])

  useEffect(() => {
    const openGame = () => setGameOpen(true)
    window.addEventListener('arteco:open-game', openGame as any)
    return () => window.removeEventListener('arteco:open-game', openGame as any)
  }, [])

  async function loadData() {
    try {
      // Определяем скорость соединения
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        (connection.downlink && connection.downlink < 1.5)
      )

      // Критические данные (баннеры и товары) загружаем сразу и параллельно
      // ВАЖНО: Выбираем только нужные поля для списков товаров, чтобы уменьшить размер ответа
      const criticalPromises = [
        supabase
          .from('promo_blocks')
          .select('id, title, description, image_url, video_url, link_url, button_text, position, sort_order, is_active')
          .eq('is_active', 'true')
          .order('position', { ascending: true }),
        supabase
          .from('products')
          .select('id, name, description, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, model_3d_url')
          .eq('is_featured', 'true')
          .eq('is_hidden', false)
          .limit(8),
        supabase
          .from('products')
          .select('id, name, description, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, model_3d_url')
          .eq('is_new', 'true')
          .eq('is_hidden', false)
          .order('id', { ascending: false })
          .limit(NEW_PRODUCTS_LIMIT)
      ]

      // Категории не критичны для первого экрана - загружаем отдельно с таймаутом
      const [bannersResult, featuredResult, newResult] = await Promise.all(criticalPromises)

      setBanners((bannersResult.data || []) as Banner[])
      setFeaturedProducts((featuredResult.data || []) as Product[])
      setNewProducts((newResult.data || []) as Product[])
      // НЕ устанавливаем loading = false, так как страница уже видна
      // setLoading(false) удалено - страница показывается сразу

      // Категории загружаем после отображения основного контента
      // Выбираем только нужные поля
      if (isSlowConnection) {
        setTimeout(async () => {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name, slug, image_url, is_active')
            .order('name', { ascending: true })
          setCategories(categoriesData || [])
        }, 1000)
      } else {
        // На быстром интернете загружаем сразу
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, slug, image_url, is_active')
          .order('name', { ascending: true })
        setCategories(categoriesData || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      // Страница уже видна, просто логируем ошибку
    }
  }

  async function loadInteriors() {
    try {
      setInteriorsLoading(true)
      // Оптимизация: выбираем только нужные поля для слабого интернета
      // КРИТИЧНО: Загружаем только минимальные поля для списка интерьеров
      // gallery_images, gallery_previews, video_urls - ОГРОМНЫЕ массивы, не нужны в списке
      const { data, error } = await supabase
        .from('client_interiors')
        .select('id, title, description, cover_image, cover_preview, location, project_type, created_at')
        .order('created_at', { ascending: false })
        .limit(20) // Ограничиваем количество для слабого интернета

      if (error) throw error
      setInteriors(data || [])
    } catch (error) {
      console.error('Ошибка загрузки интерьеров клиентов:', error)
      setInteriors([])
    } finally {
      setInteriorsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if (mediaTransitionTimeoutRef.current !== null) {
          window.clearTimeout(mediaTransitionTimeoutRef.current)
        }
      }
    }
  }, [])

  const activeInterior = activeInteriorIndex !== null && activeInteriorIndex >= 0 && activeInteriorIndex < interiors.length 
    ? interiors[activeInteriorIndex] 
    : null
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
  const isGalleryModalOpen = activeInteriorIndex !== null
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
    setIsVideoPortrait(false)
  }, [activeVideoIndex, videoMedia.length, activeInterior?.id])

  useEffect(() => {
    setVideoModalSwipeOffset(0)
  }, [activeVideoIndex])

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

  function openInterior(index: number) {
    setActiveInteriorIndex(index)
    setActiveMediaIndex(0)
    setDisplayedMediaIndex(0)
    setIsMediaEntering(true)
    setActiveVideoIndex(0)
    setThumbnailOffset(0)
    touchStartXRef.current = null
    touchCurrentXRef.current = null
    setIsVideoModalOpen(false)
    setVideoModalSwipeOffset(0)
  }

  function closeInterior() {
    if (activeInteriorIndex === null) {
      return
    }

    if (typeof window !== 'undefined' && mediaTransitionTimeoutRef.current !== null) {
      window.clearTimeout(mediaTransitionTimeoutRef.current)
      mediaTransitionTimeoutRef.current = null
    }

    setActiveInteriorIndex(null)
    setActiveMediaIndex(0)
    setDisplayedMediaIndex(0)
    setIsMediaEntering(true)
    setActiveVideoIndex(0)
    setThumbnailOffset(0)
    touchStartXRef.current = null
    touchCurrentXRef.current = null
    setIsVideoModalOpen(false)
    setVideoModalSwipeOffset(0)
    setIsVideoModalDragging(false)
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
    if (!isGalleryModalOpen) return

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
  }, [isGalleryModalOpen, imageMedia.length])

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

  const showNextVideo = useCallback(() => {
    if (videoMedia.length === 0) return
    setActiveVideoIndex((prev) => (prev + 1) % videoMedia.length)
  }, [videoMedia.length])

  const showPrevVideo = useCallback(() => {
    if (videoMedia.length === 0) return
    setActiveVideoIndex((prev) => (prev - 1 + videoMedia.length) % videoMedia.length)
  }, [videoMedia.length])

  const openVideoModal = useCallback(
    (initialIndex?: number) => {
      if (videoMedia.length === 0) return
      if (typeof initialIndex === 'number' && !Number.isNaN(initialIndex)) {
        const safeIndex = Math.min(Math.max(Math.floor(initialIndex), 0), videoMedia.length - 1)
        setActiveVideoIndex(safeIndex)
      }
      setIsVideoMuted(true)
      setIsVideoModalOpen(true)
      setVideoModalSwipeOffset(0)
      setIsVideoModalDragging(false)
    },
    [videoMedia.length]
  )

  const closeVideoModal = useCallback(() => {
    setIsVideoModalOpen(false)
    setVideoModalSwipeOffset(0)
    setIsVideoModalDragging(false)
    videoModalTouchStartRef.current = null
    videoModalTouchCurrentRef.current = null
  }, [])

  const toggleVideoMute = useCallback(() => {
    setIsVideoMuted((prev) => !prev)
  }, [])

  const handleVideoModalTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (videoMedia.length <= 1) return
    if (e.touches.length > 1) return
    const firstTouch = e.touches[0]
    videoModalTouchStartRef.current = firstTouch.clientY
    videoModalTouchCurrentRef.current = firstTouch.clientY
    setIsVideoModalDragging(true)
    setVideoModalSwipeOffset(0)
    if (e.cancelable) {
      e.preventDefault()
    }
    e.stopPropagation()
  }, [videoMedia.length])

  const handleVideoModalTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (videoMedia.length <= 1) return
    if (e.touches.length > 1) return
    const currentY = e.touches[0].clientY
    videoModalTouchCurrentRef.current = currentY
    const start = videoModalTouchStartRef.current
    if (start === null) return
    const delta = currentY - start
    setVideoModalSwipeOffset(delta)
    if (e.cancelable) {
      e.preventDefault()
    }
    e.stopPropagation()
  }, [videoMedia.length])

  const handleVideoModalTouchEnd = useCallback(() => {
    const start = videoModalTouchStartRef.current
    const current = videoModalTouchCurrentRef.current
    videoModalTouchStartRef.current = null
    videoModalTouchCurrentRef.current = null

    if (start === null || current === null) {
      setVideoModalSwipeOffset(0)
      setIsVideoModalDragging(false)
      return
    }

    const delta = current - start

    if (Math.abs(delta) > 80 && videoMedia.length > 1) {
      if (delta < 0) {
        showNextVideo()
      } else {
        showPrevVideo()
      }
    }

    setVideoModalSwipeOffset(0)
    setIsVideoModalDragging(false)
  }, [showNextVideo, showPrevVideo, videoMedia.length])

  useEffect(() => {
    if (!isVideoModalOpen) {
      setVideoModalSwipeOffset(0)
      setIsVideoModalDragging(false)
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeVideoModal()
        return
      }
      if (videoMedia.length <= 1) {
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        showPrevVideo()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        showNextVideo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeVideoModal, isVideoModalOpen, showNextVideo, showPrevVideo, videoMedia.length])

  useEffect(() => {
    if (!isVideoModalOpen) {
      return
    }
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [isVideoModalOpen])

  // Показываем минимальный контент сразу, даже если данные еще загружаются
  // Это критично для медленного интернета
  // Показываем контент сразу, не ждем загрузки данных
  useEffect(() => {
    const timer = setTimeout(() => setHasShownContent(true), 100) // Быстро показываем контент
    return () => clearTimeout(timer)
  }, [])

  // Показываем скелетон только если данных еще нет И еще не прошло время показа
  if (!hasShownContent && banners.length === 0 && featuredProducts.length === 0 && newProducts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-bold tracking-wide">ART × CO</div>
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
      </div>
    )
  }

  // Группируем баннеры по позициям
  const topBanner = banners.filter(b => b.position === 'top' && b.is_active).sort((a, b) => a.sort_order - b.sort_order)[0]
  const middleBanners = banners.filter(b => b.position === 'middle' && b.is_active).sort((a, b) => a.sort_order - b.sort_order).slice(0, 2)
  const bottomBanner = banners.filter(b => b.position === 'bottom' && b.is_active).sort((a, b) => a.sort_order - b.sort_order)[0]
  // Дополнительные промо-блоки перед «Новинки»
  // 1) Пытаемся взять по позициям `middle2` и `bottom2`
  // 2) Фолбэк: берём следующие элементы из существующих позиций
  const middle2ByPosition = banners
    .filter(b => b.position === 'middle2' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 2)
  const middleFallback = banners
    .filter(b => b.position === 'middle' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(2, 4)
  const middleBanners2 = (middle2ByPosition.length > 0 ? middle2ByPosition : middleFallback)

  const bottom2ByPosition = banners
    .filter(b => b.position === 'bottom2' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
  const bottoms = banners
    .filter(b => b.position === 'bottom' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
  // Статичный баннер для блока перед "Новинки": берём любую позицию, кроме top и bottom (которые уже использованы)
  // Попробуем взять из middle после первых двух, или из любого другого источника
  const availableBanners = banners
    .filter(b => b.is_active && b.position !== 'top' && b.position !== 'bottom')
    .sort((a, b) => a.sort_order - b.sort_order)
  const bottomBanner2 = bottom2ByPosition[0] || availableBanners[0]

  return (
    <div className="min-h-screen overflow-x-hidden max-w-full bg-white">
      <main className="overflow-x-hidden contain-inline">
        {/* Первый блок: Один большой банер слева + кнопка справа */}
        {!hideSet.has('top') && topBanner && (
          <section className="py-2 clip-x overflow-x-hidden">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-10 gap-4 w-full max-w-full">
                {/* Большой банер - 7 колонок (70%) */}
                <div 
                  ref={firstBannerRef} 
                  className={`relative h-[320px] xs:h-[380px] sm:h-[480px] md:h-[560px] lg:h-[600px] col-span-10 md:col-span-7 overflow-hidden rounded-[15px] group reveal-on-scroll ${firstBannerInView ? 'in-view' : ''} max-w-full bg-gray-100`}
                >
                  {/* Видео с автоматическим запуском, если есть */}
                  {topBanner.video_url ? (
                    <video
                      src={topBanner.video_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center center',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  ) : (
                    <>
                      {/* Изображение с правильным масштабированием */}
                      <div className="absolute inset-0 w-full h-full">
                        <Image
                          src={topBanner.image_url}
                          alt={topBanner.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 70vw, (max-width: 1280px) 70vw, 70vw"
                          className="w-full h-full object-cover"
                          style={{ 
                            objectFit: 'cover',
                            objectPosition: 'center center',
                            width: '100%',
                            height: '100%'
                          }}
                          priority
                          unoptimized={true}
                        />
                      </div>
                      {/* Fallback через background-image */}
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                          backgroundImage: `url(${topBanner.image_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center center',
                          backgroundRepeat: 'no-repeat',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 xs:p-5 sm:p-6 md:p-8 z-10">
                    <h3 className="text-white text-xl xs:text-2xl sm:text-3xl md:text-3xl font-bold mb-2 sm:mb-3">
                      {topBanner.title}
                    </h3>
                    {topBanner.description && (
                      <p className="text-white/90 text-xs xs:text-sm sm:text-base mb-4 sm:mb-5">
                        {topBanner.description}
                      </p>
                    )}
                    {(topBanner.button_text || topBanner.link_url) && (
                      <div className="group">
                        <a
                          href={topBanner.link_url || (topBanner.title?.toLowerCase().includes('семейная') ? '/family-price' : '/catalog')}
                          className="inline-flex items-center gap-2 bg-white text-black font-semibold text-xs xs:text-sm sm:text-base px-3 xs:px-4 py-1.5 xs:py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.03]"
                        >
                          <span className="text-base xs:text-lg -translate-x-1 opacity-70 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">→</span>
                          <span>{topBanner.button_text || 'Перейти'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопка каталога - 3 колонки (30%) */}
                <a
                  href="/catalog"
                  className="h-[320px] xs:h-[380px] sm:h-[480px] md:h-[560px] lg:h-[600px] col-span-10 md:col-span-3 flex flex-col justify-between text-black hover:opacity-90 transition-opacity py-6 xs:py-7 sm:py-8 px-6 xs:px-7 sm:px-8 md:px-12 rounded-[15px] max-w-full contain-inline"
                  style={{ backgroundColor: '#F7A8C2' }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-3 md:gap-4 group">
                      <h2 className="text-xl xs:text-2xl sm:text-2xl md:text-2xl font-semibold leading-tight tracking-tight group-hover:translate-x-2 transition-all duration-300">
                         За покупками
                       </h2>
                      <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-14 md:h-14 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-lg xs:text-xl md:text-xl">→</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs xs:text-sm text-gray-700">
                    <p>Магазин: ARTECO.ru</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Второй блок: Два промо-баннера */}
        {!hideSet.has('middle') && middleBanners.length > 0 && (
          <section className="py-2 clip-x overflow-x-hidden">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                {middleBanners.map((banner) => (
                  <div 
                    key={banner.id} 
                    className="relative h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden rounded-[15px] group max-w-full bg-gray-100"
                  >
                    {/* Видео с автоматическим запуском, если есть */}
                    {banner.video_url ? (
                      <video
                        src={banner.video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-0"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center center',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    ) : (
                      <>
                        {/* Изображение с правильным масштабированием */}
                        <div className="absolute inset-0 w-full h-full z-0">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center center',
                              width: '100%',
                              height: '100%'
                            }}
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                        {/* Fallback через background-image */}
                        <div 
                          className="absolute inset-0 w-full h-full z-0"
                          style={{
                            backgroundImage: `url(${banner.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10">
                      <h3 className="text-white text-2xl sm:text-3xl font-bold mb-3">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-white/90 text-sm sm:text-base mb-5">
                          {banner.description}
                        </p>
                      )}
                      <div className="group">
                        <a
                          href={banner.link_url || '/'}
                          className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm sm:text-base px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.03]"
                        >
                          <span className="text-lg -translate-x-1 opacity-70 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">→</span>
                          <span>{banner.button_text || 'Подробнее'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Третий блок: Статический промо-баннер с анимацией */}
        {!hideSet.has('bottom') && bottomBanner && (
          <section className="py-2 clip-x overflow-x-hidden">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div
                className="block w-full h-[600px] md:h-[700px] relative overflow-hidden rounded-[15px] group cursor-pointer max-w-full contain-inline"
                style={{ 
                  background: '#B2F542',
                }}
              >
                {/* Черные сердечки (анимация из центра вверх) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[15px] max-w-full">
                  <div className="absolute bottom-1/3 left-[38%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-60 group-hover:translate-x-6" style={{ transitionDelay: '0ms' }}>
                    <span className="text-5xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[38%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-64 group-hover:-translate-x-10" style={{ transitionDelay: '200ms' }}>
                    <span className="text-4xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[50%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-72 group-hover:translate-x-3" style={{ transitionDelay: '400ms' }}>
                    <span className="text-6xl text-black">♡</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[50%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-56 group-hover:-translate-x-5" style={{ transitionDelay: '300ms' }}>
                    <span className="text-3xl text-black">♥</span>
                  </div>
                  
                  {/* Дополнительные черные сердечки */}
                  <div className="absolute bottom-1/3 left-[35%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-54 group-hover:translate-x-8" style={{ transitionDelay: '100ms' }}>
                    <span className="text-4xl text-black">♡</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[35%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-62 group-hover:-translate-x-12" style={{ transitionDelay: '500ms' }}>
                    <span className="text-5xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[52%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-48 group-hover:translate-x-2" style={{ transitionDelay: '600ms' }}>
                    <span className="text-3xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[52%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-50 group-hover:-translate-x-3" style={{ transitionDelay: '150ms' }}>
                    <span className="text-4xl text-black">♥</span>
                  </div>
                </div>

                {/* Контент */}
                <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
                  {/* Главный заголовок - по центру */}
                  <div className="text-center animate-[slideUp_1.5s_ease-out]">
                    <h3 className="text-black text-4xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight">
                      The ARTECO kitchen<br />
                      <span className="block mt-4">
                        match<wbr />maker
                      </span>
                    </h3>
                  </div>
                  
                  {/* Текст и кнопка - внизу слева */}
                  <div className="absolute bottom-8 sm:bottom-10 left-6 sm:left-8 flex flex-col items-start gap-1 group-hover:translate-x-4 transition-all duration-300 animate-[slideUpBottom_1.8s_ease-out_0.5s_both]">
                    <p className="text-black text-sm mb-1">
                      Откройте для себя кухню своей мечты
                    </p>
                    
                    {/* Кнопка с анимацией стрелки */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setQuizOpen(true)
                      }}
                      className="flex items-center cursor-pointer"
                    >
                      <span className="w-0 overflow-hidden opacity-0 group-hover:w-6 group-hover:opacity-100 transition-[width,opacity,transform] duration-300 -translate-x-2 group-hover:translate-x-0 text-3xl text-black mr-0 group-hover:mr-2">→</span>
                      <span className="text-black font-semibold text-2xl">
                        Пройди тест!
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {!debugHideCategories && !hideSet.has('categories') && <Categories categories={categories} />}

        {/* Дополнительные два промо-баннера (динамичные) */}
        {!hideSet.has('middle2') && middleBanners2.length > 0 && (
          <section className="pt-12 pb-2 clip-x overflow-x-hidden">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                {middleBanners2.map((banner) => (
                  <div 
                    key={banner.id} 
                    className="relative h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden rounded-[15px] group max-w-full bg-gray-100"
                  >
                    {/* Видео с автоматическим запуском, если есть */}
                    {banner.video_url ? (
                      <video
                        src={banner.video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-0"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center center',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    ) : (
                      <>
                        {/* Изображение с правильным масштабированием */}
                        <div className="absolute inset-0 w-full h-full z-0">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center center',
                              width: '100%',
                              height: '100%'
                            }}
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                        {/* Fallback через background-image */}
                        <div 
                          className="absolute inset-0 w-full h-full z-0"
                          style={{
                            backgroundImage: `url(${banner.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10">
                      <h3 className="text-white text-2xl sm:text-3xl font-bold mb-3">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-white/90 text-sm sm:text-base mb-5">
                          {banner.description}
                        </p>
                      )}
                      <div className="group">
                        <a
                          href={banner.link_url || '/'}
                          className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm sm:text-base px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.03]"
                        >
                          <span className="text-lg -translate-x-1 opacity-70 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">→</span>
                          <span>{banner.button_text || 'Подробнее'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Один статичный промо-баннер (ниже) */}
        {!hideSet.has('bottom2') && bottomBanner2 && (
          <section className="py-2 clip-x overflow-x-hidden">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <a
                href={bottomBanner2.link_url || '#'}
                className="block w-full h-[600px] md:h-[700px] relative overflow-hidden rounded-[15px] group cursor-pointer max-w-full contain-inline"
                style={{ 
                  background: '#FFA94D',
                }}
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('arteco:open-game')) }}
              >
                {/* Черные шарики (анимация из центра вверх) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[15px] max-w-full">
                  <div className="absolute bottom-1/3 left-1/3 sm:left-[38%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-60 group-hover:translate-x-6" style={{ transitionDelay: '0ms' }}>
                    <span className="text-5xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 sm:right-[38%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-64 group-hover:-translate-x-10" style={{ transitionDelay: '200ms' }}>
                    <span className="text-4xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 left-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-72 group-hover:translate-x-3" style={{ transitionDelay: '400ms' }}>
                    <span className="text-6xl text-black">○</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-56 group-hover:-translate-x-5" style={{ transitionDelay: '300ms' }}>
                    <span className="text-3xl text-black">●</span>
                  </div>
                  
                  {/* Дополнительные черные шарики */}
                  <div className="absolute bottom-1/3 left-1/3 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-54 group-hover:translate-x-8" style={{ transitionDelay: '100ms' }}>
                    <span className="text-4xl text-black">○</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-62 group-hover:-translate-x-12" style={{ transitionDelay: '500ms' }}>
                    <span className="text-5xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[52%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-48 group-hover:translate-x-2" style={{ transitionDelay: '600ms' }}>
                    <span className="text-3xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[52%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-50 group-hover:-translate-x-3" style={{ transitionDelay: '150ms' }}>
                    <span className="text-4xl text-black">●</span>
                  </div>
                </div>

                {/* Контент */}
                <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
                  {/* Главный заголовок - по центру */}
                  <div className="opacity-100 group-hover:animate-[slideInFromLeft_0.8s_ease-out] transition-opacity duration-300 text-center sm:text-left">
                    <h3 className="text-black text-4xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight">
                      Замер за 1₽
                    </h3>
                  </div>
                  
                  {/* Текст и кнопка - внизу слева */}
                  <div className="absolute bottom-8 sm:bottom-10 left-6 sm:left-8 flex flex-col items-start gap-1 group-hover:translate-x-4 transition-all duration-300 animate-[slideUpBottom_1.8s_ease-out_0.5s_both]">
                    <p className="text-black text-sm mb-1">
                      Выиграйте консультацию дизайнера у вас дома
                    </p>
                    
                    {/* Кнопка с анимацией стрелки */}
                    <div className="flex items-center">
                      <span className="w-0 overflow-hidden opacity-0 group-hover:w-6 group-hover:opacity-100 transition-[width,opacity,transform] duration-300 -translate-x-2 group-hover:translate-x-0 text-3xl text-black mr-0 group-hover:mr-2">→</span>
                      <span className="text-black font-semibold text-2xl" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('arteco:open-game')) }}>
                        Играть
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </section>
        )}

        {/* Новинки */}
        {!hideSet.has('new') && newProducts.length > 0 && (
          <section className="py-8 bg-white">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                <div className="order-2 md:order-1 flex-1">
                  <ProductGrid
                    products={newProducts.slice(0, NEW_PRODUCTS_LIMIT)}
                    onlyFirstTwo
                    hideButton={true}
                    hideColors={true}
                  />
                </div>
                <div className="order-1 md:order-2 w-full md:w-[420px] lg:w-[480px]">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Каталог новинок</h2>
                  <p className="text-gray-600 text-base mb-4">
                    ARTECO – интернет-магазин по-настоящему удобной мебели. Мы предлагаем своим покупателям современную мебель собственного производства и готовы гарантировать не только высокое качество изделий, но и доступную цену. А наши регулярные акции и специальные предложения приятно удивят!
                  </p>
                  <div>
                    <a href="/catalog" className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-2">
                      Посмотреть всё →
                    </a>
                  </div>
                </div>
              </div>
              {/* Остальные товары во всю ширину */}
              {newProducts.slice(0, NEW_PRODUCTS_LIMIT).length > 2 && (
                <div className="mt-6">
                  <ProductGrid
                    products={newProducts.slice(2, NEW_PRODUCTS_LIMIT)}
                    hideButton={true}
                    hideColors={true}
                    ctaRight={(
                      <a
                        href="/catalog"
                        className="hidden lg:flex lg:col-span-2 lg:col-start-3 relative rounded-[18px] text-white items-center justify-center min-h-[300px] shadow-xl transition-all group px-10 overflow-hidden"
                      >
                        {/* Светло-голубой градиентный фон */}
                        <div className="absolute inset-0 bg-[#e0f2fe]" />
                        {/* Неоновая аура по краям */}
                        <div className="absolute -inset-1 rounded-[22px] bg-[conic-gradient(from_180deg,rgba(255,255,255,.3),rgba(224,242,254,.5),rgba(255,255,255,.3))] opacity-25 blur-2xl" />
                        {/* Тонкий бликовый градиент сверху-слева */}
                        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-100/30 blur-3xl group-hover:opacity-50 opacity-25 transition-opacity duration-500" />
                        {/* Лёгкая сетка-узор */}
                        <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle,#000_1px,transparent_1px)] [background-size:16px_16px]" />

                        <div className="relative flex items-center justify-center gap-4 group-hover:translate-x-2 transition-transform duration-300">
                          <h2 className="text-2xl font-semibold leading-tight text-black/80">
                            Перейти в каталог
                          </h2>
                          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <span className="text-[#e0f2fe] text-xl">→</span>
                          </div>
                        </div>
                      </a>
                    )}
                  />
                  {/* Кнопка на мобилке под всеми карточками */}
                  <a href="/catalog" className="lg:hidden mt-4 block w-full rounded-[16px] text-black text-center py-5 font-semibold shadow-lg transition-all relative overflow-hidden animate-pulse md:animate-none hover:scale-[1.02] active:scale-[0.98]">
                    <span className="absolute inset-0 bg-[#e0f2fe]" />
                    <span className="absolute -inset-1 rounded-[20px] bg-[conic-gradient(from_180deg,rgba(255,255,255,.3),rgba(224,242,254,.5),rgba(255,255,255,.3))] opacity-25 blur-xl" />
                    <span className="relative flex items-center justify-center gap-2">
                      Перейти в каталог
                      <span className="inline-block animate-arrow-right">→</span>
                    </span>
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Arteco - реальные интерьеры */}
        <section className="py-8 bg-white">
          <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
            {interiorsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200/70 bg-gradient-to-br from-gray-100 via-gray-50 to-white animate-pulse"
                  >
                    <div className="absolute inset-4 rounded-lg border border-dashed border-gray-200" />
                  </div>
                ))}
              </div>
            ) : interiors.length > 0 ? (
              <>
                <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                  <div className="order-2 md:order-1 flex-1">
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
                      {interiors.slice(0, 2).map((interior, index) => (
                        <button
                          type="button"
                          key={interior.id}
                          onClick={() => openInterior(index)}
                          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition-all duration-500 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_32px_90px_-45px_rgba(15,23,42,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
                        >
                          {interior.cover_image ? (
                            <Image
                              src={interior.cover_image}
                              alt={interior.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                              unoptimized={true}
                              priority={index < 2}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
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
                            <div className="text-base sm:text-lg md:text-xl font-semibold text-white leading-tight line-clamp-2">
                              {interior.title}
                            </div>
                            {(interior.location || interior.subtitle) && (
                              <div className="mt-2 text-xs sm:text-sm text-white/80">
                                {interior.location || interior.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="order-1 md:order-2 w-full md:w-[420px] lg:w-[480px]">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Arteco - реальные интерьеры</h2>
                    <p className="text-gray-600 text-base mb-4">
                      Вдохновитесь реальными интерьерами, созданных с любовью. Продуманные проекты дизайнеров реализованными нашими силами
                    </p>
                  </div>
                </div>
                {/* Остальные карточки во всю ширину */}
                {interiors.length > 2 && (
                  <div className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {interiors.slice(2).map((interior, index) => (
                        <button
                          type="button"
                          key={interior.id}
                          onClick={() => openInterior(index + 2)}
                          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition-all duration-500 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_32px_90px_-45px_rgba(15,23,42,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
                        >
                          {interior.cover_image ? (
                            <Image
                              src={interior.cover_image}
                              alt={interior.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              unoptimized={true}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                              Изображение готовится
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                          <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-white/85 text-[10px] sm:text-xs tracking-[0.4em] text-gray-700 shadow-sm">
                            {String(index + 3).padStart(2, '0')}
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
                            <div className="text-base sm:text-lg md:text-xl font-semibold text-white leading-tight line-clamp-2">
                              {interior.title}
                            </div>
                            {(interior.location || interior.subtitle) && (
                              <div className="mt-2 text-xs sm:text-sm text-white/80">
                                {interior.location || interior.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 py-16 px-6 text-center text-sm sm:text-base text-gray-500">
                Добавьте реальные интерьеры через админ-панель, чтобы вдохновлять клиентов.
              </div>
            )}
          </div>
        </section>

        {/* Модальные окна для интерьеров */}
        {isGalleryModalOpen && activeInterior && isMounted && typeof window !== 'undefined' && document.body
          ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center px-0 py-4 sm:px-4 sm:py-6">
              <button
                type="button"
                aria-label="Закрыть просмотр интерьера"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeInterior}
              />
              <div className="relative z-10 w-full h-full max-h-none overflow-hidden rounded-none sm:rounded-[32px] bg-white shadow-[0_40px_140px_-60px_rgba(15,23,42,0.65)]">
                <div className="border-b border-gray-100">
                  <div className="mx-auto flex w-full max-w-[1340px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8 xl:px-12 2xl:max-w-[1560px]">
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
                </div>

                <div className="h-[calc(100vh-120px)] overflow-y-auto">
                  <div
                    className="mx-auto w-full max-w-[1340px] space-y-8 px-4 pt-4 pb-20 sm:px-6 sm:pt-8 sm:pb-20 lg:px-8 xl:px-12 2xl:max-w-[1560px]"
                    style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
                  >
                    <div>
                      <div className="lg:flex lg:items-start lg:gap-6 xl:gap-8 2xl:gap-12">
                        {imageMedia.length > 1 && (
                          <div className="hidden lg:flex lg:w-[150px] lg:flex-col lg:gap-3 lg:pr-0 xl:w-[180px] xl:pr-2 2xl:w-[200px] 2xl:pr-4">
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
                                  className={`relative h-20 w-36 overflow-hidden rounded-2xl border transition-all duration-200 ${
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
                                    unoptimized={true}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
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
                          className="relative flex-1 min-w-0 h-[300px] sm:h-[380px] md:h-[460px] lg:h-[640px] xl:h-[760px] 2xl:h-[840px] overflow-hidden rounded-[28px] bg-gray-100"
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
                              <div className="relative h-full w-full">
                                <Image
                                  key={`${activeMediaItem.url}-${displayedMediaIndex}`}
                                  src={activeMediaItem.url}
                                  alt={activeInterior.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1024px) 100vw, 60vw"
                                  unoptimized={true}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              </div>
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
                              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-2xl border transition-all duration-200 snap-start ${
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
                                unoptimized={true}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex h-full flex-col gap-6 lg:gap-7 xl:gap-9">
                      <div className="space-y-4">
                        {activeInterior.subtitle && (
                          <p className="text-sm text-gray-500 leading-relaxed">{activeInterior.subtitle}</p>
                        )}
                        {activeInterior.description && (
                          <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                            {activeInterior.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:self-stretch">
                        {activeInterior.location && (
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Локация</div>
                            <div className="text-sm text-gray-700">{activeInterior.location}</div>
                          </div>
                        )}
                        {activeInterior.area && (
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Площадь</div>
                            <div className="text-sm text-gray-700">{activeInterior.area}</div>
                          </div>
                        )}
                        {activeInterior.style && (
                          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">Стиль</div>
                            <div className="text-sm text-gray-700">{activeInterior.style}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
          : null}

        <GameModal open={gameOpen} onClose={() => setGameOpen(false)} />
        <KitchenMatchmakerQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      </main>
    </div>
  )
}

