'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useCart } from '@/components/CartContext'
import { useWishlist } from '@/components/WishlistContext'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { withQueryTimeout } from '@/lib/supabase-query'
import ProductGrid from '@/components/ProductGrid'
import KitchenQuiz from '@/components/KitchenQuiz'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Динамический импорт 3D просмотрщика - three.js очень тяжелый (~600KB)
const Product3DViewer = dynamic(() => import('@/components/Product3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Загрузка 3D модели...</span>
      </div>
    </div>
  ),
})
import type { Metadata } from 'next'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  original_price?: number | null
  price_type?: 'fixed' | 'per_m2' | null
  price_per_m2?: number | null
  stock_quantity?: number | null
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  handles?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  fillings?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  hinges?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  drawers?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  lighting?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  specs?: { 
    body_material?: string
    facade_material?: string
    additional?: string
    handles?: string
    handle_material?: string
    back_wall_material?: string
    delivery_option?: string
    feet?: string
    country?: string
    custom?: Array<{ label: string; value: string }>
  } | null
  schemes?: string[] | null
  videos?: string[] | null
  downloadable_files?: Array<{ url: string; name: string }> | null
  interior_images?: string[] | null
  model_3d_url?: string | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  is_custom_size?: boolean
  related_products?: number[] | null
  color_products?: Record<string, number> | null
  rich_content?: Array<{ title: string; description: string; image_url?: string; video_url?: string }> | null
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { add } = useCart()
  const { toggle, isInWishlist } = useWishlist()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false) // НЕ блокируем показ страницы
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedHandlesIdx, setSelectedHandlesIdx] = useState<number | null>(null)
  const [selectedFillingIdx, setSelectedFillingIdx] = useState<number | null>(null)
  const [selectedHingeIdx, setSelectedHingeIdx] = useState<number | null>(null)
  const leftMainImageRef = useRef<HTMLDivElement | null>(null)
  const [syncedRightHeight, setSyncedRightHeight] = useState<number>(0)
  const [selectedDrawerIdx, setSelectedDrawerIdx] = useState<number | null>(null)
  const [selectedLightingIdx, setSelectedLightingIdx] = useState<number | null>(null)
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null)
  const [customArea, setCustomArea] = useState<number | null>(null) // Площадь для расчета цены за м²
  // Плавное появление изображений после полной загрузки
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})
  // Хук для отслеживания брейкпоинта (избегаем разницы SSR/CSR)
  function useMediaQuery(query: string) {
    const [matches, setMatches] = useState<boolean>(false)
    useEffect(() => {
      if (typeof window === 'undefined') return
      const mql = window.matchMedia(query)
      const onChange = (e: MediaQueryListEvent | MediaQueryList) => setMatches('matches' in e ? e.matches : (e as MediaQueryList).matches)
      setMatches(mql.matches)
      mql.addEventListener ? mql.addEventListener('change', onChange as any) : mql.addListener(onChange as any)
      return () => { mql.removeEventListener ? mql.removeEventListener('change', onChange as any) : mql.removeListener(onChange as any) }
    }, [query])
    return matches
  }
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // touch-swipe по главному фото
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)
  const isHorizontalSwipeRef = useRef<boolean>(false)
  // Конструктор модулей (состояния объявлены до вычисления finalPrice)
  const [modules, setModules] = useState<Array<{ id:number; name:string; price:number; image_url?:string|null; description?:string|null; width?:number|null; height?:number|null; depth?:number|null; kind?:string|null }>>([])
  const [selectedModules, setSelectedModules] = useState<Record<number, number>>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [interiorPreviewIdx, setInteriorPreviewIdx] = useState<number | null>(null)
  const [showDesignProjectForm, setShowDesignProjectForm] = useState(false)
  const interiorCarouselRef = useRef<HTMLDivElement | null>(null)
  const [openModuleGroup, setOpenModuleGroup] = useState<'base' | 'wall' | 'tall' | 'other' | null>('base')
  const finalPrice = useMemo(() => {
    if (!product) return 0
    // Доплаты опций
    const handles = (product.handles && selectedHandlesIdx != null && product.handles[selectedHandlesIdx]?.delta_price) || 0
    const hinge = (product.hinges && selectedHingeIdx != null && product.hinges[selectedHingeIdx]?.delta_price) || 0
    const drawer = (product.drawers && selectedDrawerIdx != null && product.drawers[selectedDrawerIdx]?.delta_price) || 0
    const lighting = (product.lighting && selectedLightingIdx != null && product.lighting[selectedLightingIdx]?.delta_price) || 0
    const modulesSum = Object.entries(selectedModules).reduce((sum, [id, qty]) => {
      const m = modules.find(x => x.id === Number(id))
      return sum + (m ? m.price * (qty || 0) : 0)
    }, 0)

    const hasModules = modulesSum > 0

    // Базовая цена:
    // - если пользователь добавил модули через конструктор, базовая цена не учитывается
    // - цена считается только за выбранные модули
    // - если цена за м², умножаем на площадь (customArea или price_per_m2)
    let base = hasModules ? 0 : (Number(product.price) || 0)
    
    if (product.price_type === 'per_m2' && base > 0) {
      const area = customArea || product.price_per_m2 || 1
      base = base * area
    }

    return base + handles + hinge + drawer + lighting + modulesSum
  }, [product, selectedHandlesIdx, selectedHingeIdx, selectedDrawerIdx, selectedLightingIdx, selectedModules, modules, customArea])
  const [openHandles, setOpenHandles] = useState(false)
  const [openFilling, setOpenFilling] = useState(true)
  const [openHinge, setOpenHinge] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openLighting, setOpenLighting] = useState(false)
  const [activeTab, setActiveTab] = useState<'schemes' | 'videos'>('videos')
  const [related, setRelated] = useState<any[]>([])
  // Квиз «Рассчитать под мои размеры»
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [quizStep, setQuizStep] = useState<1 | 2 | 3>(1)
  const [quizData, setQuizData] = useState<{ shape?: 'straight' | 'g' | 'island'; leftWidth?: string; rightWidth?: string; wallWidth?: string; ceiling?: string }>({})
  const primaryFallbackImage = product?.images?.[activeImageIdx] || product?.images?.[0] || product?.image_url || ''
  const [activeSchemeIdx, setActiveSchemeIdx] = useState(0)

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  // Отдельный эффект больше не нужен — используем matchMedia выше

  useEffect(() => {
    const updateHeight = () => {
      const h = leftMainImageRef.current?.offsetHeight || 0
      setSyncedRightHeight(h)
    }
    updateHeight()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && leftMainImageRef.current) {
      ro = new ResizeObserver(() => updateHeight())
      ro.observe(leftMainImageRef.current)
    } else {
      window.addEventListener('resize', updateHeight)
    }
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  // Нативные обработчики touch событий для главного фото (чтобы избежать ошибок passive event listeners)
  useEffect(() => {
    if (!product) return
    
    // Получаем массив изображений (может быть пустым или с одним элементом)
    const images = (product.images && product.images.length > 0) ? product.images : (product.image_url ? [product.image_url] : [])
    if (images.length <= 1) return

    // Используем небольшую задержку для гарантии, что элемент отрендерился в DOM
    let cleanupFn: (() => void) | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let attempts = 0
    const maxAttempts = 20 // Максимум 20 попыток (1 секунда)
    
    const setupHandlers = () => {
      const imageElement = leftMainImageRef.current
      if (!imageElement) {
        attempts++
        if (attempts < maxAttempts) {
          // Если элемент еще не готов, пробуем еще раз через небольшую задержку
          timeoutId = setTimeout(setupHandlers, 50)
          return
        }
        // Если элемент не найден после всех попыток, прекращаем
        return
      }

      const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        touchStartTime.current = Date.now()
        isHorizontalSwipeRef.current = false
      }

      const handleTouchMove = (e: TouchEvent) => {
        const startX = touchStartX.current
        const startY = touchStartY.current
        if (startX == null || startY == null) return
        
        const touch = e.touches[0]
        const diffX = Math.abs(touch.clientX - startX)
        const diffY = Math.abs(touch.clientY - startY)
        
        // Определяем направление на раннем этапе (первые 5-10px движения)
        // Более строгое условие: горизонтальное движение должно быть в 2.5 раза больше вертикального
        if (diffX > 5 && diffX > diffY * 2.5) {
          // Устанавливаем флаг горизонтального свайпа
          if (!isHorizontalSwipeRef.current) {
            isHorizontalSwipeRef.current = true
          }
          // Блокируем вертикальную прокрутку только при горизонтальном свайпе
          // Проверяем, можно ли отменить событие перед вызовом preventDefault()
          if (e.cancelable) {
            e.preventDefault()
          }
        } else if (diffY > 5 && diffY > diffX * 1.5) {
          // Если это явно вертикальный свайп, разрешаем прокрутку страницы
          isHorizontalSwipeRef.current = false
        }
      }

      const handleTouchEnd = (e: TouchEvent) => {
        const startX = touchStartX.current
        const startY = touchStartY.current
        const startTime = touchStartTime.current
        const isHorizontal = isHorizontalSwipeRef.current
        
        if (startX == null || startY == null || startTime == null) {
          isHorizontalSwipeRef.current = false
          return
        }
        
        const dx = e.changedTouches[0].clientX - startX
        const dy = e.changedTouches[0].clientY - startY
        const duration = Date.now() - startTime
        
        // Определяем минимальное расстояние (меньше для быстрых свайпов)
        const minDistance = duration < 300 ? 25 : 40
        const minVelocity = 0.25
        const distance = Math.abs(dx)
        const velocity = distance / Math.max(duration, 1)
        
        // Учитываем только горизонтальные свайпы (если флаг установлен или движение горизонтальное)
        const isDefinitelyHorizontal = isHorizontal || (Math.abs(dx) > Math.abs(dy) * 1.5)
        
        if (isDefinitelyHorizontal && (distance > minDistance || velocity > minVelocity)) {
          // Получаем актуальный массив изображений
          const currentImages = (product?.images && product.images.length > 0) ? product.images : (product?.image_url ? [product.image_url] : [])
          if (currentImages.length <= 1) return
          
          if (dx < 0) {
            // Свайп влево - следующее изображение (бесконечный цикл)
            const nextIdx = activeImageIdx === currentImages.length - 1 ? 0 : activeImageIdx + 1
            setActiveImageIdx(nextIdx)
          } else if (dx > 0) {
            // Свайп вправо - предыдущее изображение (бесконечный цикл)
            const prevIdx = activeImageIdx === 0 ? currentImages.length - 1 : activeImageIdx - 1
            setActiveImageIdx(prevIdx)
          }
        }
        
        // Сбрасываем состояние
        touchStartX.current = null
        touchStartY.current = null
        touchStartTime.current = null
        isHorizontalSwipeRef.current = false
      }

      // Добавляем обработчики с { passive: false } для возможности вызова preventDefault()
      imageElement.addEventListener('touchstart', handleTouchStart, { passive: true })
      imageElement.addEventListener('touchmove', handleTouchMove, { passive: false })
      imageElement.addEventListener('touchend', handleTouchEnd, { passive: true })

      cleanupFn = () => {
        imageElement.removeEventListener('touchstart', handleTouchStart)
        imageElement.removeEventListener('touchmove', handleTouchMove)
        imageElement.removeEventListener('touchend', handleTouchEnd)
      }
    }

    setupHandlers()
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (cleanupFn) cleanupFn()
    }
  }, [product, activeImageIdx])

  useEffect(() => {
    const loadRelated = async () => {
      if (!product) return
      // 1) Если в товаре заданы related_products — показываем их
      const relIds: number[] = ((product as any).related_products || []) as number[]
      if (Array.isArray(relIds) && relIds.length > 0) {
        const { data } = await withQueryTimeout<Product[]>(
          supabase
            .from('products')
            .select('id, name, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, model_3d_url')
            .in('id', relIds)
            .limit(12)
        )
        // Сохранить исходный порядок relIds
        const byId: Record<number, any> = {}
        const productsData = Array.isArray(data) ? data : []
        productsData.forEach((p: any) => { byId[p.id] = p })
        setRelated(relIds.map(id => byId[id]).filter(Boolean))
        return
      }
      // 2) Иначе — подбор по категории
      if (!product.category_id) return
      const { data } = await withQueryTimeout<Product[]>(
        supabase
          .from('products')
          .select('id, name, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, model_3d_url')
          .eq('category_id', product.category_id)
          .eq('is_hidden', false) // Исключаем скрытые товары из рекомендаций
          .neq('id', product.id)
          .limit(8)
      )
      if (data && Array.isArray(data) && data.length > 0) { setRelated(data as Product[]); return }
      // 3) Фоллбек: любые товары (исключаем скрытые)
      const { data: fallback } = await withQueryTimeout<Product[]>(
        supabase
          .from('products')
          .select('id, name, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, model_3d_url')
          .eq('is_hidden', false) // Исключаем скрытые товары из рекомендаций
          .neq('id', product.id)
          .limit(8)
      )
      setRelated(Array.isArray(fallback) ? (fallback as Product[]) : [])
    }
    loadRelated()
  }, [product])

  useEffect(() => {
    if (!product) return
    const hasVideo = Array.isArray(product.videos) && product.videos.length > 0
    if (!hasVideo && activeTab === 'videos') {
      setActiveTab('schemes')
    }
  }, [product, activeTab])

  useEffect(() => {
    setActiveSchemeIdx(0)
  }, [product?.id])

  // Фильтруем пустые значения из interior_images
  const validInteriorImages = Array.isArray(product?.interior_images) 
    ? product.interior_images.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
    : []

  // Обработка клавиатуры для модального окна фото в интерьере
  useEffect(() => {
    if (interiorPreviewIdx === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (interiorPreviewIdx === null || validInteriorImages.length === 0) return

      if (e.key === 'Escape') {
        setInteriorPreviewIdx(null)
      } else if (e.key === 'ArrowLeft' && interiorPreviewIdx > 0) {
        setInteriorPreviewIdx(interiorPreviewIdx - 1)
      } else if (e.key === 'ArrowRight' && interiorPreviewIdx < validInteriorImages.length - 1) {
        setInteriorPreviewIdx(interiorPreviewIdx + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [interiorPreviewIdx, validInteriorImages.length])

  const customSpecs = Array.isArray((product?.specs as any)?.custom)
    ? ((product?.specs as any)?.custom as Array<{ label?: string; value?: string }>)
    : []

  const specsPanel = (
    <div className="md:col-span-7 md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto pr-1">
      <h3 className="text-lg font-semibold mb-4">Характеристики</h3>
      <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
        {product?.specs?.body_material && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал корпуса</span><span>{product?.specs?.body_material}</span></div>
        )}
        {product?.specs?.facade_material && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал фасадов</span><span>{product?.specs?.facade_material}</span></div>
        )}
        {product?.specs?.additional && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Дополнительно</span><span>{product?.specs?.additional}</span></div>
        )}
        {product?.specs?.handles && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Ручки</span><span>{product?.specs?.handles}</span></div>
        )}
        {product?.specs?.handle_material && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал ручек</span><span>{product?.specs?.handle_material}</span></div>
        )}
        {product?.specs?.back_wall_material && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал задней стенки</span><span>{product?.specs?.back_wall_material}</span></div>
        )}
        {product?.specs?.delivery_option && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Вариант доставки</span><span>{product?.specs?.delivery_option}</span></div>
        )}
        {product?.specs?.feet && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Подпятники</span><span>{product?.specs?.feet}</span></div>
        )}
        {product?.specs?.country && (
          <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Страна производства</span><span>{product?.specs?.country}</span></div>
        )}
        {(!product?.specs || (Object.keys(product?.specs || {}).length === 0 && customSpecs.length === 0)) && (
          <div className="text-gray-500">Характеристики отсутствуют</div>
        )}

        {customSpecs.length > 0 && customSpecs.map((row, idx) => (
          (row?.label || row?.value) && (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
              {row.label && <span className="font-semibold block mb-1">{row.label}</span>}
              {row.value && <span>{row.value}</span>}
            </div>
          )
        ))}
      </div>
    </div>
  )

  async function loadProduct() {
    try {
      const { data: productData } = await withQueryTimeout(
        supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
      )

      if (!productData) {
        setLoading(false)
        return
      }

      setProduct(productData)

      // Загружаем категорию
      const { data: categoryData } = await withQueryTimeout(
        supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', productData.category_id)
          .single()
      )

      setCategory(categoryData || null)

      // Загружаем модули для конструктора
      try {
        const { data: mods } = await withQueryTimeout(
          supabase
            .from('product_modules')
            .select('id, name, price, image_url, description, width, height, depth, kind')
            .eq('product_id', productData.id)
            .order('position', { ascending: true })
        )
          .order('position', { ascending: true })
        setModules((mods as any) || [])
      } catch {}
    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
    } finally {
      setLoading(false)
    }
  }

  function addToCart() {
    if (!product) return
    const activeImage = (product.images && product.images[activeImageIdx]) || product.image_url
    let colorLabel: string | null = null
    if (product.colors && selectedColorIdx != null) {
      const c: any = (product.colors as any[])[selectedColorIdx]
      if (typeof c === 'string') colorLabel = c
      else if (c && typeof c === 'object') {
        const value = c.value ?? ''
        const name = c.name && String(c.name).trim()
        colorLabel = name || (typeof value === 'string' && value.startsWith('http') ? 'Цвет по фото' : value)
      }
    }
    const options: Record<string, any> = {}
    if (product.handles && selectedHandlesIdx != null) {
      const h = product.handles[selectedHandlesIdx]
      if (h) options.handles = { name: h.name, delta_price: h.delta_price || 0 }
    }
    if (product.fillings && selectedFillingIdx != null) {
      const f = product.fillings[selectedFillingIdx]
      if (f) options.filling = { name: f.name, delta_price: f.delta_price || 0 }
    }
    if (product.hinges && selectedHingeIdx != null) {
      const h = product.hinges[selectedHingeIdx]
      if (h) options.hinge = { name: h.name, delta_price: h.delta_price || 0 }
    }
    if (product.drawers && selectedDrawerIdx != null) {
      const d = product.drawers[selectedDrawerIdx]
      if (d) options.drawer = { name: d.name, delta_price: d.delta_price || 0 }
    }
    if (product.lighting && selectedLightingIdx != null) {
      const l = product.lighting[selectedLightingIdx]
      if (l) options.lighting = { name: l.name, delta_price: l.delta_price || 0 }
    }
    // Передаём выбранные модули в корзину
    const modulesOptions = Object.entries(selectedModules)
      .filter(([_, qty]) => (qty || 0) > 0)
      .map(([id, qty]) => {
        const m = modules.find(x => x.id === Number(id))
        return m ? { id: m.id, name: m.name, price: m.price, qty, image_url: m.image_url || null } : null
      })
      .filter(Boolean)
    if (modulesOptions.length > 0) {
      options.modules = modulesOptions
    }
    add({ id: product.id, name: product.name, price: finalPrice, image_url: activeImage, color: colorLabel, options }, quantity)
  }

  const handleShare = async () => {
    if (!product) return
    
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = {
      title: product.name,
      text: `Посмотрите этот товар: ${product.name}`,
      url: url,
    }

    // Используем Web Share API если доступен (мобильные устройства)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err: any) {
        // Пользователь отменил или ошибка
        if (err.name !== 'AbortError') {
          console.error('Ошибка поделиться:', err)
        }
      }
    } else {
      // Fallback для десктопа: копируем ссылку в буфер обмена
      try {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована в буфер обмена!')
      } catch (err) {
        console.error('Ошибка копирования в буфер обмена:', err)
        // Альтернативный способ: показываем модалку с ссылкой
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        alert('Ссылка скопирована в буфер обмена!')
      }
    }
  }

  // Показываем страницу сразу, даже если данные еще загружаются
  // На медленном интернете это критично
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-xl">Загрузка...</div>
  //     </div>
  //   )
  // }
  
  if (false) { // Отключено - не блокируем показ страницы
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Товар не найден</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-4 md:mb-6 text-xs sm:text-sm text-gray-500 flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/catalog/${category.slug}`} className="hover:text-gray-700 truncate max-w-[150px] sm:max-w-none">
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Галерея изображений — миниатюры слева, большое фото справа */}
          <div className="order-first md:order-none w-full">
            <div className="flex gap-3">
              {/* Миниатюры слева от главного фото */}
              {product.images && product.images.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 flex-shrink-0" style={{ height: syncedRightHeight ? `${syncedRightHeight}px` : 'auto' }}>
                  <div className="overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent" style={{ height: '100%' }}>
                    <div className="flex flex-col gap-2">
                      {product.images.map((url, idx) => (
                        <button 
                          key={idx} 
                          type="button" 
                          onClick={() => setActiveImageIdx(idx)} 
                          className={`rounded overflow-hidden ring-2 flex-shrink-0 w-20 ${activeImageIdx===idx ? 'ring-black' : 'ring-transparent hover:ring-gray-300'}`}
                          style={{ aspectRatio: '1', minWidth: '80px' }}
                        >
                          <Image src={url} alt={`Фото ${idx+1}`} width={80} height={80} quality={90} className="w-full h-full object-cover" unoptimized={true} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                </div>
              )}
              
              {/* Главное фото с кнопками навигации */}
              <div className="w-full md:flex-1 relative">
                <div
                  ref={leftMainImageRef}
                  className="rounded-lg overflow-hidden shadow-lg relative w-full aspect-square max-h-[90vw] md:aspect-square md:max-h-none group bg-gray-100"
                  style={{ 
                    // Разрешаем и горизонтальную, и вертикальную прокрутку
                    touchAction: 'pan-x pan-y',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    // Добавляем will-change для оптимизации
                    willChange: (product.images && product.images.length > 1) ? 'transform' : 'auto'
                  }}
                >
                  {/* Бейджи в верхнем левом углу */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
                    {/* Бейдж "Под заказ" или "В наличии" */}
                    {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                      <>
                        {product.stock_quantity >= 9999 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50px] bg-green-50 border border-green-200">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-700 font-semibold text-sm">В наличии: Много</span>
                          </div>
                        ) : product.stock_quantity > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50px] bg-blue-50 border border-blue-200">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-700 font-semibold text-sm">В наличии: {product.stock_quantity} шт.</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50px] bg-yellow-50 border border-yellow-200">
                            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                              <path d="M13 7h-2v6h6v-2h-4z"/>
                            </svg>
                            <span className="text-yellow-700 font-semibold text-sm">Под заказ</span>
                          </div>
                        )}
                        {/* Бейдж NEW под текстом */}
                        {product.is_new && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50px] bg-green-500 border border-green-600/20 ml-1">
                            <span className="text-white font-semibold text-sm">NEW</span>
                          </span>
                        )}
                      </>
                    )}
                    {/* Если нет информации об остатках, но есть NEW */}
                    {(product.stock_quantity === undefined || product.stock_quantity === null) && product.is_new && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50px] bg-green-500 border border-green-600/20">
                        <span className="text-white font-semibold text-sm">NEW</span>
                      </span>
                    )}
                  </div>
                  {/* Контейнер для плавной анимации пролистывания */}
                  <div
                    className="flex w-full h-full transition-transform duration-700 ease-in-out"
                    style={{ 
                      transform: `translateX(-${activeImageIdx * 100}%)`
                    }}
                  >
                    {/* Если есть 3D модель, показываем её первой */}
                    {product.model_3d_url && (
                      <div className="relative w-full h-full flex-shrink-0 bg-gray-100">
                        <Product3DViewer 
                          modelUrl={product.model_3d_url}
                          autoRotate={false}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    {/* Обычные изображения */}
                    {(product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : [])).map((imgUrl, idx) => {
                      // Если есть 3D модель, индексы сдвигаются на 1
                      const displayIdx = product.model_3d_url ? idx + 1 : idx
                      const isFirstImage = displayIdx === 0
                      return (
                        <div key={idx} className="relative w-full h-full flex-shrink-0 bg-gray-100">
                          {!loadedImages[idx] && (
                            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                          )}
                          <Image
                            src={imgUrl}
                            alt={`${product.name} - фото ${idx + 1}`}
                            fill
                            sizes="(min-width: 1280px) 700px, (min-width: 768px) 50vw, 100vw"
                            quality={95}
                            priority={isFirstImage && !product.model_3d_url}
                            className={`object-cover object-center transition-opacity duration-300 ${loadedImages[idx] ? 'opacity-100' : 'opacity-0'}`}
                            unoptimized={true}
                            onLoad={() => {
                              setLoadedImages((prev) => ({ ...prev, [idx]: true }))
                              if (isFirstImage && !product.model_3d_url && leftMainImageRef.current) {
                                setSyncedRightHeight(leftMainImageRef.current.offsetHeight || 0)
                              }
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Точки пагинации */}
                  {(() => {
                    const hasModel3D = !!product.model_3d_url
                    const imagesCount = product.images?.length || (product.image_url ? 1 : 0)
                    const totalCount = (hasModel3D ? 1 : 0) + imagesCount
                    
                    if (totalCount <= 1) return null
                    
                    return (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {Array.from({ length: Math.min(totalCount, 10) }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              activeImageIdx === idx ? 'bg-white w-6' : 'bg-white/50'
                            }`}
                          />
                        ))}
                        {totalCount > 10 && (
                          <div className="w-2 h-2 rounded-full bg-white/30" />
                        )}
                      </div>
                    )
                  })()}

                  {/* Стрелки навигации (только на десктопе, внутри фото) */}
                  {product.images && product.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Предыдущее фото"
                        className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow z-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          const prevIdx = activeImageIdx === 0 ? product.images!.length - 1 : activeImageIdx - 1
                          setActiveImageIdx(prevIdx)
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Следующее фото"
                        className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow z-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          const nextIdx = activeImageIdx === product.images!.length - 1 ? 0 : activeImageIdx + 1
                          setActiveImageIdx(nextIdx)
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Миниатюры под главным фото на мобильных */}
                    {product.images && product.images.length > 1 && (
                  <div 
                    className="mt-3 md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                    style={{
                      touchAction: 'pan-x',
                      overscrollBehaviorX: 'contain',
                      overscrollBehaviorY: 'none',
                      WebkitOverflowScrolling: 'touch',
                      scrollSnapType: 'x mandatory'
                    }}
                    onTouchStart={(e) => {
                      // CSS touch-action уже настроен, дополнительная обработка не требуется
                      e.stopPropagation()
                    }}
                  >
                    <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                      {product.images.slice(0,10).map((url, idx) => (
                        <button 
                          key={idx} 
                          type="button" 
                          onClick={() => setActiveImageIdx(idx)} 
                          className={`rounded overflow-hidden ring-2 flex-shrink-0 snap-start ${activeImageIdx===idx ? 'ring-black' : 'ring-transparent'}`}
                          style={{ width: 'calc((100vw - 2rem - 0.5rem) / 4)', minWidth: 'calc((100vw - 2rem - 0.5rem) / 4)' }}
                        >
                          <Image src={url} alt={`Фото ${idx+1}`} width={200} height={200} quality={85} className="w-full h-16 object-cover" unoptimized={true} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="relative flex flex-col md:overflow-hidden" style={isDesktop && syncedRightHeight ? { height: `${syncedRightHeight}px` } : {}}>
            {/* Фиксированный хедер с названием и ценой (только на десктопе) */}
            <div className="hidden md:block sticky top-0 z-10 bg-white pb-4 mb-4">
            {category && (
              <Link
                href={`/catalog/${category.slug}`}
                  className="inline-block text-black hover:underline mb-2"
              >
                ← {category.name}
              </Link>
            )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">{product.name}</h1>

              <div className={`mt-1 mb-1 ${product?.price_type === 'per_m2' ? 'flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4' : ''}`}>
                <div className="text-3xl sm:text-4xl font-bold text-black">
                  {(product as any).original_price && (
                    <span className="text-gray-400 line-through mr-3 text-2xl sm:text-3xl font-normal">
                      {(product as any).original_price.toLocaleString('ru-RU')} {product?.price_type === 'per_m2' ? '₽/м²' : '₽'}
                    </span>
                  )}
                  <span>
                    {finalPrice.toLocaleString('ru-RU')} {product?.price_type === 'per_m2' ? '₽/м²' : '₽'}
                    {product?.price_type === 'per_m2' && customArea && <span className="text-lg font-normal text-gray-600"> за {customArea.toLocaleString('ru-RU')} м²</span>}
                  </span>
                </div>
                {product?.price_type === 'per_m2' && (
                  <div className="flex-shrink-0">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full sm:w-auto min-w-[160px] px-4 py-2 border border-gray-300 rounded-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                      value={customArea || product?.price_per_m2 || ''}
                      onChange={(e) => setCustomArea(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder={product?.price_per_m2 ? product.price_per_m2.toString() : 'Введите площадь'}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-4 md:mb-0">
              {product.is_featured && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[50px] text-sm font-semibold text-white bg-rose-400">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Sale
                </span>
              )}
              {(product as any).is_custom_size && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-black bg-white border border-black/15 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h10M4 17h6"/></svg>
                  Под любые размеры
                </span>
              )}
            </div>
            </div>

            {/* Прокручиваемая область с контентом */}
            <div className="flex-1 md:overflow-y-auto md:h-full md:pr-1">
              {product.description && (
                <p className="text-gray-600 text-base sm:text-lg leading-snug mb-4">{product.description}</p>
              )}

            {/* Блок с опциями и кнопкой */}
            <div className="bg-gray-50 rounded-lg p-3">

              {/* Свотчи цветов */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Цвета</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {product.colors.map((c, idx) => {
                      const colorObj: { value: string; imageIndex?: number | null } = typeof c === 'object' && c !== null ? (c as any) : { value: c as string, imageIndex: null }
                      const colorValue = colorObj.value || (typeof c === 'string' ? c : '')
                      const isImageUrl = typeof colorValue === 'string' && (colorValue.startsWith('http') || colorValue.startsWith('/'))
                      const isSelected = selectedColorIdx === idx
                      // Проверяем, есть ли связанный товар для этого цвета
                      const linkedProductId = product.color_products?.[idx.toString()]
                      
                      return isImageUrl ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            // Если есть связанный товар, переходим на него
                            if (linkedProductId) {
                              router.push(`/product/${linkedProductId}`)
                              return
                            }
                            // Иначе переключаем изображение
                            setSelectedColorIdx(idx)
                            if (colorObj.imageIndex !== null && colorObj.imageIndex !== undefined && product.images && product.images[colorObj.imageIndex]) {
                              setActiveImageIdx(colorObj.imageIndex)
                            } else if (product.images && product.images.length > idx) {
                              setActiveImageIdx(Math.min(idx, product.images.length - 1))
                            }
                          }}
                          className={`w-16 h-16 rounded-lg border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-black/10'} cursor-pointer hover:ring-2 hover:ring-black/20 transition-all ${linkedProductId ? 'ring-1 ring-blue-400' : ''} bg-gray-50 overflow-hidden flex items-center justify-center`}
                          title={linkedProductId ? 'Нажмите, чтобы открыть товар с этим цветом' : `Цвет ${idx + 1}`}
                        >
                          <img src={colorValue} alt={`Цвет ${idx + 1}`} className="w-full h-full rounded-lg object-contain" />
                        </button>
                      ) : (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            // Если есть связанный товар, переходим на него
                            if (linkedProductId) {
                              router.push(`/product/${linkedProductId}`)
                              return
                            }
                            // Иначе переключаем изображение
                            setSelectedColorIdx(idx)
                            if (colorObj.imageIndex !== null && colorObj.imageIndex !== undefined && product.images && product.images[colorObj.imageIndex]) {
                              setActiveImageIdx(colorObj.imageIndex)
                            } else if (product.images && product.images.length > idx) {
                              setActiveImageIdx(Math.min(idx, product.images.length - 1))
                            }
                          }}
                          className={`w-16 h-16 rounded-lg border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-black/10'} shadow-sm cursor-pointer hover:ring-2 hover:ring-black/20 transition-all ${linkedProductId ? 'ring-1 ring-blue-400' : ''}`}
                          style={{ background: colorValue || '#ccc' }}
                          title={linkedProductId ? 'Нажмите, чтобы открыть товар с этим цветом' : (colorValue || 'Цвет')}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Дополнительный контент под цветами */}
              {product.rich_content && product.rich_content.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {product.rich_content.map((block, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 md:p-5 border border-gray-200 flex flex-col">
                        {block.video_url && (
                          <div className="mb-3 md:mb-4 w-full aspect-[4/3] overflow-hidden rounded-lg bg-black">
                            <video
                              src={block.video_url}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="auto"
                              onLoadedData={(e) => {
                                const video = e.target as HTMLVideoElement
                                video.play().catch(() => {
                                  // Игнорируем ошибки автозапуска (браузер может блокировать)
                                })
                              }}
                            />
                          </div>
                        )}
                        {!block.video_url && block.image_url && (
                          <div className="mb-3 md:mb-4 w-full aspect-[4/3] overflow-hidden rounded-lg">
                            {block.image_url.toLowerCase().endsWith('.gif') ? (
                              <img
                                src={block.image_url}
                                alt={block.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image
                                src={block.image_url}
                                alt={block.title}
                                width={400}
                                height={300}
                                className="w-full h-full object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                unoptimized={true}
                              />
                            )}
                          </div>
                        )}
                        <h4 className="font-semibold text-base md:text-lg mb-2">{block.title}</h4>
                        {block.description && (
                          <p className="text-sm md:text-base text-gray-600 leading-relaxed flex-1">{block.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ручки — Аккордеон */}
              {product.handles && product.handles.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHandles(!openHandles)
                      if (!openHandles) { setOpenFilling(false); setOpenHinge(false); setOpenDrawer(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Ручки</span>
                    <span className="text-xl">{openHandles ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-2 sm:px-4 bg-white overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: openHandles ? 800 : 0, paddingBottom: openHandles ? 16 : 0, opacity: openHandles ? 1 : 0 }}
                    aria-hidden={!openHandles}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.handles.map((h, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedHandlesIdx(idx)}
                          className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedHandlesIdx===idx ? 'border-black' : 'border-gray-200'}`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            {h.image_url ? (
                              <Image src={h.image_url} alt={h.name || 'Вариант'} width={128} height={128} quality={90} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" unoptimized={true} />
                            ) : (
                              <div className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Нет фото</div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium mb-1">{h.name || 'Без названия'}</div>
                              {typeof h.delta_price === 'number' && h.delta_price !== 0 && (
                                <div className="text-sm text-gray-600 mb-1">{h.delta_price > 0 ? '+' : ''}{h.delta_price?.toLocaleString('ru-RU')} ₽</div>
                              )}
                              {h.description && <div className="text-xs text-gray-500">{h.description}</div>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
              </div>
              )}

              {/* Варианты наполнений — Аккордеон */}
              {product.fillings && product.fillings.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFilling(!openFilling)
                      if (!openFilling) { setOpenHandles(false); setOpenHinge(false); setOpenDrawer(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Вариант наполнения</span>
                    <span className="text-xl">{openFilling ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-2 sm:px-4 bg-white overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: openFilling ? 800 : 0, paddingBottom: openFilling ? 16 : 0, opacity: openFilling ? 1 : 0 }}
                    aria-hidden={!openFilling}
                  >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.fillings.map((f, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedFillingIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedFillingIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {f.image_url ? (
                                <Image src={f.image_url} alt={f.name || 'Вариант'} width={128} height={128} quality={90} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" unoptimized={true} />
                              ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Нет фото</div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium mb-1">{f.name || 'Без названия'}</div>
                                {typeof f.delta_price === 'number' && f.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600 mb-1">{f.delta_price > 0 ? '+' : ''}{f.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                                {f.description && <div className="text-xs text-gray-500">{f.description}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>
              </div>
              )}

              {/* Опция петель — Аккордеон */}
              {product.hinges && product.hinges.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHinge(!openHinge)
                      if (!openHinge) { setOpenHandles(false); setOpenFilling(false); setOpenDrawer(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Петли</span>
                    <span className="text-xl">{openHinge ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-2 sm:px-4 bg-white overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: openHinge ? 800 : 0, paddingBottom: openHinge ? 16 : 0, opacity: openHinge ? 1 : 0 }}
                    aria-hidden={!openHinge}
                  >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.hinges.map((h, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedHingeIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedHingeIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {h.image_url ? (
                                <Image src={h.image_url} alt={h.name || 'Вариант'} width={128} height={128} quality={90} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" unoptimized={true} />
                              ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Нет фото</div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium mb-1">{h.name || 'Без названия'}</div>
                                {typeof h.delta_price === 'number' && h.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600 mb-1">{h.delta_price > 0 ? '+' : ''}{h.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                                {h.description && <div className="text-xs text-gray-500">{h.description}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>
                </div>
              )}

              {/* Ящики — Аккордеон */}
              {product.drawers && product.drawers.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDrawer(!openDrawer)
                      if (!openDrawer) { setOpenHandles(false); setOpenFilling(false); setOpenHinge(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Ящики</span>
                    <span className="text-xl">{openDrawer ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-2 sm:px-4 bg-white overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: openDrawer ? 800 : 0, paddingBottom: openDrawer ? 16 : 0, opacity: openDrawer ? 1 : 0 }}
                    aria-hidden={!openDrawer}
                  >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.drawers.map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDrawerIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedDrawerIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {d.image_url ? (
                                <Image src={d.image_url} alt={d.name || 'Вариант'} width={128} height={128} quality={90} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" unoptimized={true} />
                              ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Нет фото</div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium mb-1">{d.name || 'Без названия'}</div>
                                {typeof d.delta_price === 'number' && d.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600 mb-1">{d.delta_price > 0 ? '+' : ''}{d.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                                {d.description && <div className="text-xs text-gray-500">{d.description}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>
                </div>
              )}

              {/* Подсветка — Аккордеон */}
              {product.lighting && product.lighting.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenLighting(!openLighting)
                      if (!openLighting) { setOpenHandles(false); setOpenFilling(false); setOpenHinge(false); setOpenDrawer(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Подсветка</span>
                    <span className="text-xl">{openLighting ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-2 sm:px-4 bg-white overflow-hidden transition-all duration-400 ease-in-out"
                    style={{ maxHeight: openLighting ? 800 : 0, paddingBottom: openLighting ? 16 : 0, opacity: openLighting ? 1 : 0 }}
                    aria-hidden={!openLighting}
                  >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.lighting.map((l, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedLightingIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedLightingIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {l.image_url ? (
                                <Image src={l.image_url} alt={l.name || 'Вариант'} width={128} height={128} quality={90} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" unoptimized={true} />
                              ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Нет фото</div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium mb-1">{l.name || 'Без названия'}</div>
                                {typeof l.delta_price === 'number' && l.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600 mb-1">{l.delta_price > 0 ? '+' : ''}{l.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                                {l.description && <div className="text-xs text-gray-500">{l.description}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>
              </div>
              )}

              {/* Конструктор модулей */}
              {modules && modules.length > 0 && (() => {
                const groups: Record<string, typeof modules> = { base: [], wall: [], tall: [], other: [] }
                modules.forEach(m => {
                  const k = (m.kind || '').toLowerCase()
                  if (k === 'base') groups.base.push(m)
                  else if (k === 'wall') groups.wall.push(m)
                  else if (k === 'tall') groups.tall.push(m)
                  else groups.other.push(m)
                })

                const order: Array<[string, string]> = [
                  ['base', 'Нижняя база'],
                  ['wall', 'Верхняя база'],
                  ['tall', 'Пеналы'],
                  ['other', 'Прочие'],
                ]

                return (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <div className="w-full px-4 py-3 flex items-center justify-between bg-white">
                      <span className="font-semibold">Конструктор модулей</span>
                      <span className="text-sm text-gray-500">Добавляйте модули — цена обновляется</span>
                    </div>
                    <div className="px-2 sm:px-4 pb-4 bg-white space-y-4">
                      {order.map(([key, title]) => (
                        groups[key].length > 0 && (
                          <div key={key}>
                            {/* Заголовок аккордеона */}
                            <button
                              type="button"
                              onClick={() => setOpenModuleGroup(key as any)}
                              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-[50px] border"
                            >
                              <span className="font-semibold text-gray-800">{title}</span>
                              <span className="text-xl">{openModuleGroup === (key as any) ? '−' : '+'}</span>
                            </button>

                            <div
                              className="overflow-hidden transition-all duration-400 ease-in-out"
                              style={{ maxHeight: openModuleGroup === (key as any) ? 1200 : 0, opacity: openModuleGroup === (key as any) ? 1 : 0 }}
                              aria-hidden={openModuleGroup !== (key as any)}
                            >
                              {/* Прокрутка списка модулей на мобильных, без ограничения на десктопе */}
                              <div className="mt-1 max-h-[60vh] overflow-y-auto pr-2 -mr-2 sm:max-h-none sm:overflow-visible sm:pr-0 sm:mr-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {groups[key].map((m) => {
                                  const qty = selectedModules[m.id] || 0
                                  const size = [m.width, m.height, m.depth].every(v => v) ? `${m.width}×${m.height}×${m.depth} мм` : undefined
                                  return (
                                    <div key={m.id} className="p-3 border rounded-lg" title={size ? `Габариты: ${size}` : undefined}>
                                      <div className="flex items-start gap-3">
                                        {m.image_url ? (
                                          <button type="button" onClick={() => setPreviewImage(m.image_url!)} className="focus:outline-none">
                                            <Image src={m.image_url} alt={m.name} width={128} height={128} quality={90} className="w-24 h-24 sm:w-28 sm:h-28 rounded object-cover border" unoptimized={true} />
                                          </button>
                                        ) : (
                                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">Нет фото</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">{m.name}</div>
                                          <div className="text-sm text-gray-600 mb-1">{m.price.toLocaleString('ru-RU')} ₽</div>
                                          {size && <div className="text-xs text-gray-500">{size}</div>}
                                          {m.description && <div className="text-xs text-gray-500 line-clamp-2">{m.description}</div>}
                                          <div className="mt-2 flex items-center gap-2">
                                            <button type="button" onClick={() => setSelectedModules((prev) => ({ ...prev, [m.id]: Math.max(0, (prev[m.id]||0) - 1) }))} className="w-8 h-8 rounded-full border flex items-center justify-center">−</button>
                                            <div className="w-10 text-center">{qty}</div>
                                            <button type="button" onClick={() => setSelectedModules((prev) => ({ ...prev, [m.id]: (prev[m.id]||0) + 1 }))} className="w-8 h-8 rounded-full border flex items-center justify-center">+</button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )
              })()}

                </div>
              </div>

            {/* Sticky блок с названием и ценой на мобильных (над кнопками) */}
            <div className="md:hidden sticky bottom-[140px] z-10 bg-white pt-4 pb-2 -mx-4 px-4">
              <h1 className="text-2xl font-bold mb-1 leading-tight">{product.name}</h1>
              <div className="text-3xl font-bold text-black mb-2">
                {(product as any).original_price && (
                  <span className="text-gray-400 line-through mr-2 text-2xl font-normal">
                    {(product as any).original_price.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                  </span>
                )}
                <span>
                  {finalPrice.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                </span>
              </div>
            </div>

            {/* Низ блока: количество и кнопка, закреплены вне скролла */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
              {/* Вишлист на мобильных рядом с "В корзину", на десктопе отдельно */}
              <div className="flex md:hidden sticky bottom-0 z-20 bg-white pt-4 pb-4 items-center gap-2 w-full">
                <button
                  type="button"
                  aria-label={product && isInWishlist(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                  onClick={() => {
                    if (product) {
                      toggle({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        original_price: (product as any).original_price || null,
                      })
                    }
                  }}
                  className={`w-12 h-12 rounded-full border border-black transition-colors flex items-center justify-center flex-shrink-0 ${
                    product && isInWishlist(product.id) ? 'bg-black text-white hover:bg-black/90' : 'text-black hover:bg-black/5'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${product && isInWishlist(product.id) ? 'fill-white stroke-white' : 'fill-none stroke-current'}`}
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Поделиться"
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full border border-black text-black hover:bg-black/5 transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={addToCart}
                  className="px-6 sm:px-9 py-3 sm:py-3.5 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold text-base flex-1 whitespace-nowrap"
                >
                  В корзину
                </button>
              </div>
              
              {/* Вишлист и Поделиться на десктопе */}
              <div className="hidden md:flex items-center justify-end gap-2">
                <button
                  type="button"
                  aria-label="Поделиться"
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full border border-black text-black hover:bg-black/5 transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={product && isInWishlist(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                  onClick={() => {
                    if (product) {
                      toggle({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        original_price: (product as any).original_price || null,
                      })
                    }
                  }}
                  className={`w-12 h-12 rounded-full border border-black transition-colors flex items-center justify-center flex-shrink-0 ${
                    product && isInWishlist(product.id) ? 'bg-black text-white hover:bg-black/90' : 'text-black hover:bg-black/5'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${product && isInWishlist(product.id) ? 'fill-white stroke-white' : 'fill-none stroke-current'}`}
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Кнопка "В корзину" на десктопе */}
              <button
                onClick={addToCart}
                className="hidden md:inline-block px-9 py-3.5 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold text-base whitespace-nowrap"
              >
                В корзину
              </button>
              
              {(() => {
                if (!category) return null
                const slug = (category.slug?.toLowerCase() || '')
                const name = (category.name?.toLowerCase() || '')
                const isKitchenOrWardrobe =
                  slug.includes('kitchen') || slug.includes('kuhn') || name.includes('кух') ||
                  slug.includes('shkaf') || slug.includes('wardrobe') || slug.includes('closet') ||
                  name.includes('шкаф') || name.includes('стеллаж')
                
                if (!isKitchenOrWardrobe) return null
                
                return (
                  <button
                    type="button"
                    onClick={() => { setIsCalcOpen(true); setQuizStep(1) }}
                    className="px-6 sm:px-9 py-3 sm:py-3.5 border border-black text-black rounded-[50px] hover:bg-black/5 transition-colors font-semibold text-base whitespace-nowrap flex-1 sm:flex-none"
                  >
                    Рассчитать под мои размеры
                  </button>
                )
              })()}
            </div>
            </div>
            {/* Конец прокручиваемой области */}
          </div>
          {/* Конец блока "Информация о товаре" */}


        {/* Вкладки: Характеристики / Размеры */}
        <section className="mt-8 md:mt-12 w-full">
          <div className="flex gap-2 border-b mb-4 md:mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-3 sm:px-4 py-2 -mb-[1px] border-b-2 text-sm sm:text-base whitespace-nowrap ${activeTab==='videos' ? 'border-black font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Характеристики
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schemes')}
              className={`px-3 sm:px-4 py-2 -mb-[1px] border-b-2 text-sm sm:text-base whitespace-nowrap ${activeTab==='schemes' ? 'border-black font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Размеры
            </button>
          </div>

          {activeTab === 'schemes' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              <div className="md:col-span-5 flex flex-col items-center gap-4">
                {Array.isArray(product?.schemes) && product.schemes.length > 0 && product.schemes.filter(s => s && s.trim()).length > 0 ? (
                  <>
                    {(() => {
                      const validSchemes = product.schemes.filter(s => s && s.trim())
                      const currentScheme = validSchemes[Math.min(activeSchemeIdx, validSchemes.length - 1)]
                      
                      if (!currentScheme) {
                        return (
                          <div className="w-full rounded-[28px] border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                            Схема не найдена
                          </div>
                        )
                      }
                      
                      return (
                        <>
                          <div className="w-full rounded-[28px] border border-gray-200 bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,0.45)] overflow-hidden">
                            <div className="relative aspect-[4/3] bg-white">
                              <Image
                                src={currentScheme}
                                alt={`Схема ${Math.min(activeSchemeIdx, validSchemes.length - 1) + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 520px"
                                className="object-contain bg-white"
                                quality={95}
                                unoptimized={true}
                                onError={(e) => {
                                  console.error('Ошибка загрузки схемы:', currentScheme)
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                              <a
                                href={currentScheme}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow hover:bg-white transition"
                              >
                                Открыть
                              </a>
                            </div>
                          </div>
                          {validSchemes.length > 1 && (
                            <div className="flex w-full gap-2 overflow-x-auto pb-1">
                              {validSchemes.map((schemeUrl, idx) => {
                                if (!schemeUrl || !schemeUrl.trim()) return null
                                
                                return (
                                  <button
                                    key={`${schemeUrl}-${idx}`}
                                    type="button"
                                    onClick={() => setActiveSchemeIdx(idx)}
                                    className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                                      idx === activeSchemeIdx ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <Image
                                      src={schemeUrl}
                                      alt={`Схема ${idx + 1}`}
                                      fill
                                      sizes="112px"
                                      className="object-contain bg-white"
                                      unoptimized={true}
                                      onError={(e) => {
                                        console.error('Ошибка загрузки миниатюры схемы:', schemeUrl)
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </>
                ) : (
                  <div className="text-gray-500">Схемы отсутствуют</div>
                )}
              </div>
              {specsPanel}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              <div className="w-full md:col-span-5 flex items-start justify-center">
                {(product.videos && product.videos.length > 0) ? (
                  <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
                    <video
                      src={product.videos[0]}
                      className="w-full h-auto md:h-[70vh] object-cover bg-transparent"
                      autoPlay
                      muted
                      playsInline
                      loop
                      controls
                      preload="auto"
                      poster={product.images?.[0] || product.image_url}
                      onLoadedData={(e) => {
                        const video = e.target as HTMLVideoElement
                        video.play().catch(() => {
                          // Игнорируем ошибки автозапуска (браузер может блокировать)
                        })
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[520px] rounded-[28px] border border-gray-200 bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,0.4)] overflow-hidden">
                    {primaryFallbackImage ? (
                      <div className="relative w-full aspect-[4/3] md:aspect-[5/4]">
                        <Image
                          src={primaryFallbackImage}
                          alt={product?.name ? `Изображение ${product.name}` : 'Изображение товара'}
                          fill
                          sizes="(max-width: 768px) 100vw, 480px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center text-sm text-gray-500">Медиа для товара временно отсутствуют</div>
                    )}
                  </div>
                )}
            </div>

              {specsPanel}
           </div>
         )}
         
         {/* Файлы для скачивания - отображаются в любой вкладке, если есть файлы */}
         {product.downloadable_files && product.downloadable_files.length > 0 && (
           <div className="mt-6 md:mt-8 border-t pt-6 md:pt-8">
             <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Файлы для скачивания</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {product.downloadable_files.map((file, idx) => (
                 <a
                   key={idx}
                   href={file.url}
                   download={file.name}
                   className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:border-gray-300 transition-all"
                 >
                   <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                     <div className="text-xs text-gray-500 mt-1">Скачать файл</div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                 </a>
               ))}
             </div>
           </div>
         )}
        </section>

        <KitchenQuiz isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} imageUrl={product?.images?.[0] || (product as any)?.image_url || ''} />

        {/* Просмотр изображения модуля */}
        {previewImage && (
          <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={() => setPreviewImage(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Превью модуля" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
          </div>
        )}

        {/* Фото в интерьере */}
        {validInteriorImages.length > 0 && (() => {
          
          return (
            <section className="mt-8 md:mt-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Фото в интерьере</h2>
                {/* Индикатор прокрутки на мобильных */}
                {validInteriorImages.length > 3 && (
                  <div className="md:hidden flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span>Листайте</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="relative">
                {/* Контейнер для карусели */}
                <div 
                  ref={interiorCarouselRef}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory"
                  style={{
                    touchAction: 'pan-x pan-y',
                    overscrollBehaviorX: 'contain',
                    overscrollBehaviorY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  <div 
                    className="flex gap-4 md:gap-6"
                    style={{ 
                      paddingRight: validInteriorImages.length > 3 ? '1rem' : '0'
                    }}
                  >
                    {validInteriorImages.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer snap-start w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] md:w-[calc((100vw-2rem-2rem)/3)] md:min-w-[280px] md:max-w-[calc((100vw-2rem-2rem)/3)]"
                        onClick={() => setInteriorPreviewIdx(idx)}
                      >
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={url}
                            alt={`${product.name} в интерьере ${idx + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) calc((100vw - 2rem) / 3), calc((100vw - 2rem) / 3)"
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                        {/* Индикатор номера фото на мобильных */}
                        {validInteriorImages.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full md:hidden">
                            {idx + 1} / {validInteriorImages.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Кнопки навигации на десктопе */}
                {isDesktop && validInteriorImages.length > 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (interiorCarouselRef.current) {
                          const container = interiorCarouselRef.current
                          const scrollAmount = container.offsetWidth * 0.8 // прокрутка на ~80% ширины контейнера
                          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
                        }
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center z-10 transition-all hover:scale-110"
                      aria-label="Предыдущие фото"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (interiorCarouselRef.current) {
                          const container = interiorCarouselRef.current
                          const scrollAmount = container.offsetWidth * 0.8 // прокрутка на ~80% ширины контейнера
                          container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center z-10 transition-all hover:scale-110"
                      aria-label="Следующие фото"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </section>
          )
        })()}

        {/* Кнопка "Бесплатный замер за 24 часа" */}
        <section className="mt-8 md:mt-12 mb-8 md:mb-12">
          <div className="relative overflow-hidden rounded-lg group cursor-pointer" onClick={() => setShowDesignProjectForm(true)}>
            {/* Градиентный фон с анимацией */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-700 group-hover:scale-105"></div>
            
            {/* Декоративные элементы - тонкие линии */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              <div className="absolute top-1/2 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-0 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-y-1/2"></div>
            </div>

            {/* Светящиеся точки для эффекта глубины */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full blur-sm animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-white rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white rounded-full blur-sm animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Контент */}
            <div className="relative z-10 px-6 md:px-8 lg:px-12 py-10 md:py-14 lg:py-16">
              <div className="max-w-3xl mx-auto text-center">
                {/* Иконка с анимацией */}
                <div className="flex items-center justify-center mb-6 md:mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping"></div>
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      {/* Иконка рулетки */}
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10" 
                        viewBox="0 0 100.5 100.5" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ fill: 'white', stroke: 'none' }}
                      >
                        <path 
                          d="M89.398,9.602H11.102c-0.829,0-1.5,0.672-1.5,1.5v78.296c0,0.828,0.671,1.5,1.5,1.5h29.937c0.829,0,1.5-0.672,1.5-1.5s-0.671-1.5-1.5-1.5H12.602V64.72h15.353c0.829,0,1.5-0.672,1.5-1.5s-0.671-1.5-1.5-1.5H12.602V12.602H50.75v23.672c0,0.828,0.671,1.5,1.5,1.5s1.5-0.672,1.5-1.5V12.602h34.148v37.064H39.482c-0.829,0-1.5,0.672-1.5,1.5s0.671,1.5,1.5,1.5h48.416v35.231H66.123l-11.23-16.352c-0.468-0.682-1.403-0.857-2.085-0.387c-0.683,0.469-0.856,1.402-0.387,2.086l11.677,17.002c0.28,0.407,0.742,0.65,1.236,0.65h24.065c0.829,0,1.5-0.672,1.5-1.5V11.102C90.898,10.274,90.227,9.602,89.398,9.602z" 
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Заголовок */}
                <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-white mb-4 md:mb-6 tracking-tight">
                  Бесплатный <span className="font-semibold">замер за 24 часа</span>
                </h3>

                {/* Описание */}
                <p className="text-white/70 text-sm md:text-base lg:text-lg mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed font-light">
                  Сделаем обмер, подберем материалы, спроектируем и посчитаем
                </p>

                {/* Кнопка */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDesignProjectForm(true)
                  }}
                  className="group/btn relative inline-flex items-center gap-3 px-8 md:px-10 py-3.5 md:py-4 bg-white text-black font-medium text-base md:text-lg rounded-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-white/20"
                >
                  {/* Эффект свечения при наведении */}
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></span>
                  
                  <span className="relative z-10">Получить проект</span>
                  <svg className="relative z-10 w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Модальное окно для просмотра фото в интерьере */}
        {interiorPreviewIdx !== null && validInteriorImages.length > 0 && interiorPreviewIdx >= 0 && interiorPreviewIdx < validInteriorImages.length && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setInteriorPreviewIdx(null)}
          >
            <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
              {/* Кнопка закрытия */}
              <button
                onClick={() => setInteriorPreviewIdx(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Закрыть"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Кнопка "Назад" */}
              {validInteriorImages.length > 1 && interiorPreviewIdx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInteriorPreviewIdx(interiorPreviewIdx - 1)
                  }}
                  className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Предыдущее фото"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Кнопка "Вперед" */}
              {validInteriorImages.length > 1 && interiorPreviewIdx < validInteriorImages.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInteriorPreviewIdx(interiorPreviewIdx + 1)
                  }}
                  className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Следующее фото"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Изображение с поддержкой свайпов */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX
                }}
                onTouchMove={(e) => {
                  if (touchStartX.current === null) return
                  const diff = touchStartX.current - e.touches[0].clientX
                  if (Math.abs(diff) > 50) {
                    if (diff > 0 && interiorPreviewIdx !== null && interiorPreviewIdx < validInteriorImages.length - 1) {
                      setInteriorPreviewIdx(interiorPreviewIdx + 1)
                      touchStartX.current = null
                    } else if (diff < 0 && interiorPreviewIdx !== null && interiorPreviewIdx > 0) {
                      setInteriorPreviewIdx(interiorPreviewIdx - 1)
                      touchStartX.current = null
                    }
                  }
                }}
                onTouchEnd={() => {
                  touchStartX.current = null
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={validInteriorImages[interiorPreviewIdx]} 
                  alt={`${product.name} в интерьере ${interiorPreviewIdx + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Счетчик изображений */}
              {validInteriorImages.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white/80 text-sm">
                  {interiorPreviewIdx + 1} / {validInteriorImages.length}
                </div>
              )}

              {/* Индикатор текущего изображения */}
              {validInteriorImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                  {validInteriorImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        setInteriorPreviewIdx(idx)
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === interiorPreviewIdx ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Фото ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-8 md:mt-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">Вам понравится</h2>
            <ProductGrid products={related as any} horizontal />
          </section>
        )}

        {/* Модальное окно для заявки на бесплатный замер */}
        {showDesignProjectForm && <DesignProjectFormModal 
          productName={product?.name || ''} 
          onClose={() => setShowDesignProjectForm(false)} 
        />}

      </main>
    </div>
  )
}

// Компонент модального окна для заявки на дизайн проект
function DesignProjectFormModal({ productName, onClose }: { productName: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    comment: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 1) formatted = `+${digits[0]} ${digits.slice(1)}`
    if (digits.length >= 4) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4)}`
    if (digits.length >= 7) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
    if (digits.length >= 9) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9,11)}`
    setFormData({ ...formData, phone: formatted })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Пожалуйста, заполните имя и телефон')
      return
    }

    setIsSubmitting(true)

    try {
      const comment = `Бесплатный замер за 24 часа для товара: ${productName}${formData.comment ? '\n\n' + formData.comment : ''}`
      
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          comment: comment,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при отправке заявки')
      }

      setIsSuccess(true)
      setFormData({ name: '', phone: '', email: '', comment: '' })
      
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 3000)
    } catch (error: any) {
      console.error('Ошибка отправки заявки:', error)
      alert(error.message || 'Не удалось отправить заявку. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Заявка отправлена!</h3>
            <p className="text-sm text-gray-600">Наш менеджер свяжется с вами в ближайшее время</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Бесплатный замер за 24 часа</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <div>
                <label htmlFor="design-name" className="block text-sm text-gray-700 mb-1">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  id="design-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all outline-none"
                  placeholder="Иван Иванов"
                />
              </div>
              
              <div>
                <label htmlFor="design-phone" className="block text-sm text-gray-700 mb-1">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <input
                  id="design-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all outline-none"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label htmlFor="design-email" className="block text-sm text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="design-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all outline-none"
                  placeholder="ivan@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="design-comment" className="block text-sm text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  id="design-comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all outline-none resize-none"
                  placeholder="Опишите ваши пожелания..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}


