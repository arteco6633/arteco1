'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useCart } from '@/components/CartContext'
import { useWishlist } from '@/components/WishlistContext'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductGrid from '@/components/ProductGrid'
import KitchenQuiz from '@/components/KitchenQuiz'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string
  images?: string[] | null
  colors?: string[] | null
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
  } | null
  schemes?: string[] | null
  videos?: string[] | null
  downloadable_files?: Array<{ url: string; name: string }> | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  related_products?: number[] | null
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function ProductPage() {
  const params = useParams()
  const id = params?.id as string
  const { add } = useCart()
  const { toggle, isInWishlist } = useWishlist()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedFillingIdx, setSelectedFillingIdx] = useState<number | null>(null)
  const [selectedHingeIdx, setSelectedHingeIdx] = useState<number | null>(null)
  const leftMainImageRef = useRef<HTMLDivElement | null>(null)
  const [syncedRightHeight, setSyncedRightHeight] = useState<number>(0)
  const [selectedDrawerIdx, setSelectedDrawerIdx] = useState<number | null>(null)
  const [selectedLightingIdx, setSelectedLightingIdx] = useState<number | null>(null)
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null)
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
  const [openModuleGroup, setOpenModuleGroup] = useState<'base' | 'wall' | 'tall' | 'other' | null>('base')
  const finalPrice = useMemo(() => {
    if (!product) return 0
    // Цена формируется только из: Петли + Ящики + Подсветка + Модули
    // БЕЗ основной цены товара и БЕЗ наполнения
    const hinge = (product.hinges && selectedHingeIdx != null && product.hinges[selectedHingeIdx]?.delta_price) || 0
    const drawer = (product.drawers && selectedDrawerIdx != null && product.drawers[selectedDrawerIdx]?.delta_price) || 0
    const lighting = (product.lighting && selectedLightingIdx != null && product.lighting[selectedLightingIdx]?.delta_price) || 0
    const modulesSum = Object.entries(selectedModules).reduce((sum, [id, qty]) => {
      const m = modules.find(x => x.id === Number(id))
      return sum + (m ? m.price * (qty || 0) : 0)
    }, 0)
    // Итоговая цена: Петли + Ящики + Подсветка + Модули
    return hinge + drawer + lighting + modulesSum
  }, [product, selectedHingeIdx, selectedDrawerIdx, selectedLightingIdx, selectedModules, modules])
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

  useEffect(() => {
    const loadRelated = async () => {
      if (!product) return
      // 1) Если в товаре заданы related_products — показываем их
      const relIds: number[] = ((product as any).related_products || []) as number[]
      if (Array.isArray(relIds) && relIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .in('id', relIds)
          .limit(12)
        // Сохранить исходный порядок relIds
        const byId: Record<number, any> = {}
        ;(data || []).forEach((p: any) => { byId[p.id] = p })
        setRelated(relIds.map(id => byId[id]).filter(Boolean))
        return
      }
      // 2) Иначе — подбор по категории
      if (!product.category_id) return
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(8)
      if (data && data.length > 0) { setRelated(data); return }
      // 3) Фоллбек: любые товары
      const { data: fallback } = await supabase
        .from('products')
        .select('*')
        .neq('id', product.id)
        .limit(8)
      setRelated(fallback || [])
    }
    loadRelated()
  }, [product?.id, product?.category_id, (product as any)?.related_products])

  async function loadProduct() {
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!productData) {
        setLoading(false)
        return
      }

      setProduct(productData)

      // Загружаем категорию
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', productData.category_id)
        .single()

      setCategory(categoryData)

      // Загружаем модули для конструктора
      try {
        const { data: mods } = await supabase
          .from('product_modules')
          .select('id, name, price, image_url, description, width, height, depth, kind')
          .eq('product_id', productData.id)
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
        return m ? { id: m.id, name: m.name, price: m.price, qty } : null
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

  if (loading) {
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
          <div className="order-first md:order-none">
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
                          <img src={url} alt={`Фото ${idx+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Главное фото с кнопками навигации */}
              <div className="flex-1 relative">
                <div
                  ref={leftMainImageRef}
                  className="rounded-lg overflow-hidden shadow-lg relative aspect-square"
                  style={{ 
                    // Используем pan-y для разрешения только вертикальной прокрутки
                    // pinch-zoom для масштабирования
                    // none для блокировки горизонтальной прокрутки страницы
                    touchAction: (product.images && product.images.length > 1) ? 'pan-y pinch-zoom' : 'auto',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    // Добавляем will-change для оптимизации
                    willChange: (product.images && product.images.length > 1) ? 'transform' : 'auto'
                  }}
                  onTouchStart={(e) => {
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                    touchStartTime.current = Date.now()
                    isHorizontalSwipeRef.current = false
                  }}
                  onTouchMove={(e) => {
                    if (!product.images || product.images.length <= 1) return
                    const startX = touchStartX.current
                    const startY = touchStartY.current
                    if (startX == null || startY == null) return
                    
                    const touch = e.touches[0]
                    const diffX = Math.abs(touch.clientX - startX)
                    const diffY = Math.abs(touch.clientY - startY)
                    
                    // Определяем направление на раннем этапе (первые 10-15px движения)
                    // Более строгое условие: горизонтальное движение должно быть в 2.5 раза больше вертикального
                    if (diffX > 10 && diffX > diffY * 2.5) {
                      // Устанавливаем флаг горизонтального свайпа
                      if (!isHorizontalSwipeRef.current) {
                        isHorizontalSwipeRef.current = true
                      }
                      // Не используем preventDefault() - вместо этого полагаемся на CSS touch-action
                      // CSS touch-action: pan-y pinch-zoom уже настроен, что блокирует горизонтальную прокрутку страницы
                    } else if (diffY > 10 && diffY > diffX * 1.5) {
                      // Если это явно вертикальный свайп, сбрасываем флаг
                      isHorizontalSwipeRef.current = false
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!product.images || product.images.length <= 1) {
                      isHorizontalSwipeRef.current = false
                      return
                    }
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
                      if (dx < 0) {
                        // Свайп влево - следующее изображение (бесконечный цикл)
                        const nextIdx = activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1
                        setActiveImageIdx(nextIdx)
                      } else if (dx > 0) {
                        // Свайп вправо - предыдущее изображение (бесконечный цикл)
                        const prevIdx = activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1
                        setActiveImageIdx(prevIdx)
                      }
                    }
                    
                    // Сбрасываем состояние
                    touchStartX.current = null
                    touchStartY.current = null
                    touchStartTime.current = null
                    isHorizontalSwipeRef.current = false
                  }}
                >
                  {/* Контейнер для плавной анимации пролистывания */}
                  <div
                    className="flex w-full h-full transition-transform duration-700 ease-in-out"
                    style={{ 
                      transform: `translateX(-${activeImageIdx * 100}%)`
                    }}
                  >
                    {(product.images && product.images.length > 0 ? product.images : [product.image_url || '/placeholder.jpg']).map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`${product.name} - фото ${idx + 1}`}
                        className="w-full h-full flex-shrink-0 object-cover"
                        loading={idx === 0 ? "eager" : "lazy"}
                        onLoad={() => {
                          if (idx === 0 && leftMainImageRef.current) {
                            setSyncedRightHeight(leftMainImageRef.current.offsetHeight || 0)
                          }
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Точки пагинации */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {product.images.slice(0, 10).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            activeImageIdx === idx ? 'bg-white w-6' : 'bg-white/50'
                          }`}
                        />
                      ))}
                      {product.images.length > 10 && (
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                      )}
                    </div>
                  )}
                </div>

                {/* Миниатюры под главным фото на мобильных */}
                {product.images && product.images.length > 1 && (
                  <div className="mt-3 md:hidden grid grid-cols-4 gap-2">
                    {product.images.slice(0,10).map((url, idx) => (
                      <button key={idx} type="button" onClick={() => setActiveImageIdx(idx)} className={`rounded overflow-hidden ring-2 ${activeImageIdx===idx ? 'ring-black' : 'ring-transparent'}`}>
                        <img src={url} alt={`Фото ${idx+1}`} className="w-full h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="relative flex flex-col md:overflow-hidden" style={isDesktop && syncedRightHeight ? { height: `${syncedRightHeight}px` } : {}}>
            {/* Фиксированный хедер с названием и ценой */}
            <div className="md:sticky md:top-0 md:z-10 bg-white md:pb-4 md:border-b md:border-gray-200 md:mb-4">
            {category && (
              <Link
                href={`/catalog/${category.slug}`}
                  className="inline-block text-black hover:underline mb-2"
              >
                ← {category.name}
              </Link>
            )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">{product.name}</h1>

              <div className="text-3xl sm:text-4xl font-bold text-black mt-1 mb-1">
                {finalPrice.toLocaleString('ru-RU')} ₽
              </div>

              <div className="flex gap-2 mb-4 md:mb-0">
              {product.is_new && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  NEW
                </span>
              )}
              {product.is_featured && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ Рекомендуем
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
                      return isImageUrl ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedColorIdx(idx)
                            // Если цвет связан с изображением через imageIndex
                            if (colorObj.imageIndex !== null && colorObj.imageIndex !== undefined && product.images && product.images[colorObj.imageIndex]) {
                              setActiveImageIdx(colorObj.imageIndex)
                            } else if (product.images && product.images.length > idx) {
                              // Фоллбек: если нет связи, переключаемся по индексу
                              setActiveImageIdx(Math.min(idx, product.images.length - 1))
                            }
                          }}
                          className={`w-12 h-12 rounded-full border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-black/10'} object-cover cursor-pointer hover:ring-2 hover:ring-black/20 transition-all`}
                        >
                          <img src={colorValue} alt={`Цвет ${idx + 1}`} className="w-full h-full rounded-full object-cover" />
                        </button>
                      ) : (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedColorIdx(idx)
                            // Если цвет связан с изображением через imageIndex
                            if (colorObj.imageIndex !== null && colorObj.imageIndex !== undefined && product.images && product.images[colorObj.imageIndex]) {
                              setActiveImageIdx(colorObj.imageIndex)
                            } else if (product.images && product.images.length > idx) {
                              // Фоллбек: если нет связи, переключаемся по индексу
                              setActiveImageIdx(Math.min(idx, product.images.length - 1))
                            }
                          }}
                          className={`w-12 h-12 rounded-full border-2 ${isSelected ? 'border-black ring-2 ring-black/30' : 'border-black/10'} shadow-sm cursor-pointer hover:ring-2 hover:ring-black/20 transition-all`}
                          style={{ background: colorValue || '#ccc' }}
                          title={colorValue || 'Цвет'}
                        />
                      )
                    })}
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
                      if (!openFilling) { setOpenHinge(false); setOpenDrawer(false); setOpenLighting(false) }
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
                                <img src={f.image_url} alt={f.name || 'Вариант'} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                      if (!openHinge) { setOpenFilling(false); setOpenDrawer(false); setOpenLighting(false) }
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
                                <img src={h.image_url} alt={h.name || 'Вариант'} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                      if (!openDrawer) { setOpenFilling(false); setOpenHinge(false); setOpenLighting(false) }
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
                                <img src={d.image_url} alt={d.name || 'Вариант'} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                      if (!openLighting) { setOpenFilling(false); setOpenHinge(false); setOpenDrawer(false) }
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
                                <img src={l.image_url} alt={l.name || 'Вариант'} className="w-24 h-24 sm:w-32 sm:h-32 min-w-[96px] sm:min-w-[128px] rounded object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                                            <img src={m.image_url} alt={m.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded object-cover border" />
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

            {/* Низ блока: количество и кнопка, закреплены вне скролла */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
              {/* Вишлист на мобильных рядом с "В корзину", на десктопе отдельно */}
              <div className="flex md:hidden items-center gap-2 justify-end">
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
                  className="px-8 py-3 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold text-base flex-1"
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
                className="hidden md:inline-block px-9 py-3.5 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold text-base"
              >
                В корзину
              </button>
              
              <button
                type="button"
                onClick={() => { setIsCalcOpen(true); setQuizStep(1) }}
                className="px-6 sm:px-9 py-3 sm:py-3.5 border border-black text-black rounded-[50px] hover:bg-black/5 transition-colors font-semibold text-base whitespace-nowrap flex-1 sm:flex-none"
              >
                Рассчитать под мои размеры
              </button>
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
            <div className="w-full space-y-6">
              {(product.schemes && product.schemes.length > 0) ? (
                product.schemes.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-full rounded-lg overflow-hidden border hover:shadow-lg bg-white transition-shadow">
                    <img src={url} alt={`Схема ${idx+1}`} className="w-full object-contain bg-white" style={{ maxHeight: '700px' }} />
                  </a>
                ))
              ) : (
                <div className="text-gray-500">Схемы отсутствуют</div>
              )}

              {/* Спецификация */}
              {product.downloadable_files && product.downloadable_files.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold mb-4">Спецификация</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.downloadable_files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        download={file.name}
                        className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
                      >
                        <span className="text-3xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-xs text-gray-500 mt-1">Скачать файл</div>
                        </div>
                        <span className="text-gray-400">↓</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              <div className="w-full md:col-span-5 flex items-start justify-center">
                {(product.videos && product.videos.length > 0) ? (
                  <div className="w-full rounded-lg overflow-hidden">
                    <video
                      src={product.videos[0]}
                      className="w-full h-auto md:h-[70vh] object-cover bg-transparent"
                      autoPlay
                      muted
                      playsInline
                      loop
                      controls
                      poster={product.images?.[0] || product.image_url}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">Видео отсутствуют</div>
                )}
              </div>

              <div className="md:col-span-7 md:sticky md:top-24 md:max-h-[70vh] md:overflow-auto pr-1">
                <h3 className="text-lg font-semibold mb-4">Характеристики</h3>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
                  {product.specs?.body_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал корпуса</span><span>{product.specs.body_material}</span></div>
                  )}
                  {product.specs?.facade_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал фасадов</span><span>{product.specs.facade_material}</span></div>
                  )}
                  {product.specs?.additional && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Дополнительно</span><span>{product.specs.additional}</span></div>
                  )}
                  {product.specs?.handles && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Ручки</span><span>{product.specs.handles}</span></div>
                  )}
                  {product.specs?.handle_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал ручек</span><span>{product.specs.handle_material}</span></div>
                  )}
                  {product.specs?.back_wall_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал задней стенки</span><span>{product.specs.back_wall_material}</span></div>
                  )}
                  {product.specs?.delivery_option && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Вариант доставки</span><span>{product.specs.delivery_option}</span></div>
                  )}
                  {product.specs?.feet && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Подпятники</span><span>{product.specs.feet}</span></div>
                  )}
                  {product.specs?.country && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Страна производства</span><span>{product.specs.country}</span></div>
                  )}
                  {!product.specs || Object.keys(product.specs).length === 0 && (
                    <div className="text-gray-500">Характеристики отсутствуют</div>
                  )}
            </div>
          </div>
        </div>
          )}
        </section>

        <KitchenQuiz isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} imageUrl={product?.images?.[0] || (product as any)?.image_url || ''} />

        {/* Просмотр изображения модуля */}
        {previewImage && (
          <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Превью модуля" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-8 md:mt-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">Вам понравится</h2>
            <ProductGrid products={related as any} horizontal />
          </section>
        )}

      </main>
    </div>
  )
}


