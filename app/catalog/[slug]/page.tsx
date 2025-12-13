'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { withQueryTimeout, isSlowConnection as checkSlowConnection } from '@/lib/supabase-query'
import Link from 'next/link'
import { useWishlist } from '@/components/WishlistContext'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  original_price?: number | null
  price_type?: 'fixed' | 'per_m2' | null
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  is_custom_size?: boolean
  is_fast_delivery?: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { toggle, isInWishlist } = useWishlist()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false) // НЕ блокируем показ страницы
  const [onlyCustom, setOnlyCustom] = useState<boolean>(false)
  const [onlyFastDelivery, setOnlyFastDelivery] = useState<boolean>(false)
  // Выбранные варианты цветов/изображений по товару (индекс)
  const [selectedVariantIndexById, setSelectedVariantIndexById] = useState<Record<number, number>>({})
  // Состояния для свайпа на мобильных
  const [touchStartX, setTouchStartX] = useState<Record<number, number>>({})
  const [touchStartY, setTouchStartY] = useState<Record<number, number>>({})
  const [touchStartTime, setTouchStartTime] = useState<Record<number, number>>({})
  const [touchEndX, setTouchEndX] = useState<Record<number, number>>({})
  const [touchEndY, setTouchEndY] = useState<Record<number, number>>({})
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<Record<number, boolean>>({})

  function createHoverScrubHandler(productId: number, imagesLength: number) {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imagesLength || imagesLength <= 1) return
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = Math.min(Math.max(x / rect.width, 0), 1)
      const idx = Math.min(imagesLength - 1, Math.floor(ratio * imagesLength))
      setSelectedVariantIndexById((prev) => ({ ...prev, [productId]: idx }))
    }
  }

  // Улучшенные обработчики для свайпа на мобильных
  function handleTouchStart(productId: number, e: React.TouchEvent) {
    const touch = e.touches[0]
    setTouchStartX((prev) => ({ ...prev, [productId]: touch.clientX }))
    setTouchStartY((prev) => ({ ...prev, [productId]: touch.clientY }))
    setTouchStartTime((prev) => ({ ...prev, [productId]: Date.now() }))
    setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: false }))
  }

  function handleTouchMove(productId: number, e: React.TouchEvent) {
    const touch = e.touches[0]
    const startX = touchStartX[productId]
    const startY = touchStartY[productId]
    
    if (startX === undefined || startY === undefined) return
    
    const diffX = Math.abs(touch.clientX - startX)
    const diffY = Math.abs(touch.clientY - startY)
    
    // Определяем направление на раннем этапе (первые 8-10px движения)
    // Более строгое условие: горизонтальное движение должно быть в 3 раза больше вертикального
    if (diffX > 8 && diffX > diffY * 3) {
      // Устанавливаем флаг горизонтального свайпа
      if (!isHorizontalSwipe[productId]) {
        setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: true }))
      }
      // Обновляем конечные позиции для обработки свайпа
      setTouchEndX((prev) => ({ ...prev, [productId]: touch.clientX }))
      setTouchEndY((prev) => ({ ...prev, [productId]: touch.clientY }))
      // Предотвращаем прокрутку страницы при горизонтальном свайпе
      e.preventDefault()
      e.stopPropagation()
    } else if (diffY > 8 && diffY > diffX * 2) {
      // Если это явно вертикальный свайп, сбрасываем флаг
      setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: false }))
    }
  }

  function handleTouchEnd(productId: number, imagesLength: number) {
    if (!imagesLength || imagesLength <= 1) {
      setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: false }))
      return
    }
    
    const startX = touchStartX[productId]
    const startY = touchStartY[productId]
    const endX = touchEndX[productId]
    const startTime = touchStartTime[productId]
    const isHorizontal = isHorizontalSwipe[productId]
    
    if (startX === undefined || endX === undefined || startTime === undefined) {
      setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: false }))
      return
    }

    const endY = touchEndY[productId]
    const diff = startX - endX
    const diffY = startY !== undefined && endY !== undefined ? Math.abs(startY - endY) : 0
    const duration = Date.now() - startTime
    
    // Определяем минимальное расстояние (меньше для быстрых свайпов)
    const minDistance = duration < 300 ? 20 : 35 // Быстрый свайп требует меньше расстояния
    const minVelocity = 0.2 // Минимальная скорость для быстрого свайпа
    
    const distance = Math.abs(diff)
    const velocity = distance / Math.max(duration, 1)
    
    // Учитываем только горизонтальные свайпы
    // Более строгие условия: флаг должен быть установлен ИЛИ горизонтальное движение должно быть в 2.5 раза больше вертикального
    const isDefinitelyHorizontal = isHorizontal || (Math.abs(diff) > Math.abs(diffY) * 2.5)
    
    if (isDefinitelyHorizontal && (distance > minDistance || velocity > minVelocity)) {
      const currentIdx = selectedVariantIndexById[productId] || 0
      
      if (diff > 0) {
        // Свайп влево - следующее изображение (бесконечный цикл)
        const nextIdx = currentIdx === imagesLength - 1 ? 0 : currentIdx + 1
        setSelectedVariantIndexById((prev) => ({
          ...prev,
          [productId]: nextIdx
        }))
      } else {
        // Свайп вправо - предыдущее изображение (бесконечный цикл)
        const prevIdx = currentIdx === 0 ? imagesLength - 1 : currentIdx - 1
        setSelectedVariantIndexById((prev) => ({
          ...prev,
          [productId]: prevIdx
        }))
      }
    }
    
    // Сбрасываем флаг
    setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: false }))
    
    // Сбрасываем позиции
    setTouchStartX((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setTouchStartY((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setTouchStartTime((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setTouchEndX((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setTouchEndY((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  useEffect(() => {
    if (!slug) return
    const customFlag = searchParams?.get('anysize') === '1'
    const fastDeliveryFlag = searchParams?.get('fast') === '1'
    setOnlyCustom(customFlag)
    setOnlyFastDelivery(fastDeliveryFlag)
    loadCategoryData(customFlag, fastDeliveryFlag)
  }, [slug, searchParams])

  async function loadCategoryData(customFlag?: boolean, fastDeliveryFlag?: boolean) {
    try {
      // Загружаем категорию - выбираем только нужные поля
      const categoryQuery = supabase
        .from('categories')
        .select('id, name, slug, description, image_url, is_active')
        .eq('slug', slug)
        .single()
      
      const { data: categoryData, error: categoryError } = await withQueryTimeout(categoryQuery)

      if (categoryError || !categoryData) {
        setLoading(false)
        return
      }

      setCategory(categoryData as Category)

      // Загружаем товары этой категории (исключаем скрытые)
      // ОПТИМИЗАЦИЯ: Убрали description из списка - он не нужен для карточек в каталоге
      const slowConn = checkSlowConnection()
      let productsQuery = supabase
        .from('products')
        .select('id, name, price, original_price, price_type, price_per_m2, image_url, images, colors, category_id, is_featured, is_new, is_custom_size, is_fast_delivery, model_3d_url')
        .eq('category_id', categoryData.id)
        .eq('is_hidden', false) // Исключаем скрытые товары из каталога
        .order('id', { ascending: false })
      
      // Ограничиваем количество на медленном интернете
      if (slowConn) {
        productsQuery = productsQuery.limit(20) // Меньше товаров на медленном интернете
      }
      
      if (customFlag) {
        productsQuery = productsQuery.eq('is_custom_size', true)
      }
      if (fastDeliveryFlag) {
        productsQuery = productsQuery.eq('is_fast_delivery', true)
      }
      
      const { data: productsData } = await withQueryTimeout(productsQuery)

      setProducts(productsData || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyAnySize(next: boolean) {
    setOnlyCustom(next)
    const sp = new URLSearchParams(Array.from(searchParams?.entries() || []))
    if (next) sp.set('anysize', '1'); else sp.delete('anysize')
    router.replace(`/catalog/${slug}?${sp.toString()}`)
  }

  function applyFastDelivery(next: boolean) {
    setOnlyFastDelivery(next)
    const sp = new URLSearchParams(Array.from(searchParams?.entries() || []))
    if (next) sp.set('fast', '1'); else sp.delete('fast')
    router.replace(`/catalog/${slug}?${sp.toString()}`)
  }

  // Показываем страницу сразу, даже если данные еще загружаются
  // На медленном интернете это критично

  if (!category) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Категория не найдена</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1680px] 2xl:max-w-none px-4 md:px-2 xl:px-4 2xl:px-6 py-6 md:py-8">
        {/* Заголовок категории */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 text-base sm:text-lg">{category.description}</p>
          )}
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">Главная</Link></li>
            <li>/</li>
            <li className="text-gray-900">{category.name}</li>
          </ol>
        </nav>

        {/* Фильтры */}
        <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={onlyCustom}
              onClick={() => applyAnySize(!onlyCustom)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${onlyCustom ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${onlyCustom ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className="text-sm md:text-base select-none">Под любые размеры</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={onlyFastDelivery}
              onClick={() => applyFastDelivery(!onlyFastDelivery)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${onlyFastDelivery ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${onlyFastDelivery ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className="text-sm md:text-base select-none">Доставим быстро</span>
          </div>
        </div>

        {/* Сетка товаров */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold mb-2">Нет товаров в этой категории</h2>
            <p className="text-gray-600">В данной категории пока нет товаров</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-6 gap-y-4 sm:gap-y-5 md:gap-y-7">
            {products.map((product) => {
              const images = (product as any).images as string[] | undefined
              const currentImageIdx = selectedVariantIndexById[product.id] || 0
              
              // Подготовка массива всех изображений для отображения
              const imagesToDisplay = images && images.length > 0 
                ? images 
                : [product.image_url || '/placeholder.jpg']
              
              const hasMultipleImages = imagesToDisplay.length > 1
              
              // Безопасный индекс, чтобы не выйти за границы массива
              const safeCurrentImageIdx = Math.min(
                Math.max(0, currentImageIdx),
                imagesToDisplay.length - 1
              )
              
              return (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="group block relative hover:z-10 md:rounded-2xl bg-transparent md:bg-white md:border md:border-gray-100 md:shadow-sm md:hover:shadow-lg transition-shadow duration-300 md:min-h-[460px]"
              >
                <div className="relative z-10 p-0 md:px-3 md:pt-3 md:pb-3">
                  <div
                    className="relative overflow-hidden rounded-xl aspect-[4/5] md:aspect-[4/3] bg-gray-100"
                    style={{ 
                      // Используем pan-y для разрешения только вертикальной прокрутки
                      // pinch-zoom для масштабирования
                      // Блокируем горизонтальную прокрутку страницы при множественных изображениях
                      touchAction: imagesToDisplay.length > 1 ? 'pan-y pinch-zoom' : 'auto',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      // Добавляем will-change для оптимизации
                      willChange: imagesToDisplay.length > 1 ? 'transform' : 'auto',
                      // Предотвращаем случайную прокрутку страницы
                      overscrollBehaviorX: imagesToDisplay.length > 1 ? 'contain' : 'auto'
                    }}
                    onMouseMove={createHoverScrubHandler(product.id, imagesToDisplay.length)}
                    onMouseLeave={() => setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: 0 }))}
                    onTouchStart={(e) => {
                      if (imagesToDisplay.length > 1) {
                        handleTouchStart(product.id, e)
                      }
                    }}
                    onTouchMove={(e) => {
                      if (imagesToDisplay.length > 1) {
                        // Проверяем направление движения перед вызовом handleTouchMove
                        const touch = e.touches[0]
                        const startX = touchStartX[product.id]
                        const startY = touchStartY[product.id]
                        
                        if (startX !== undefined && startY !== undefined) {
                          const diffX = Math.abs(touch.clientX - startX)
                          const diffY = Math.abs(touch.clientY - startY)
                          
                          // Если это явно горизонтальный свайп (в 3 раза больше вертикального), предотвращаем прокрутку страницы
                          if (diffX > 8 && diffX > diffY * 3) {
                            e.preventDefault()
                            e.stopPropagation()
                          }
                        }
                        
                        handleTouchMove(product.id, e)
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (imagesToDisplay.length > 1) {
                        handleTouchEnd(product.id, imagesToDisplay.length)
                      }
                    }}
                  >
                    {/* Контейнер для плавной анимации пролистывания */}
                    <div
                      className="flex w-full h-full transition-transform duration-700 ease-in-out"
                      style={{ 
                        transform: `translateX(-${safeCurrentImageIdx * 100}%)`
                      }}
                    >
                      {imagesToDisplay.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`${product.name} - фото ${idx + 1}`}
                          className="w-full h-full flex-shrink-0 md:group-hover:scale-[1.02] transition-transform duration-300 object-cover"
                          loading={idx === 0 ? "eager" : "lazy"}
                        />
                      ))}
                    </div>
                    {(product.is_new || product.is_featured || (product as any).is_custom_size) && (
                      <div className="absolute top-2 left-2 flex flex-col items-start md:flex-row md:items-center gap-2">
                        {(product as any).is_custom_size && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap text-black bg-white/95 border border-black/10 shadow-sm">
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h10M4 17h6"/></svg>
                            Под любые размеры
                          </span>
                        )}
                        {product.is_new && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-[50px] text-xs font-semibold inline-block">
                            NEW
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[50px] text-[11px] font-semibold whitespace-nowrap bg-rose-400 text-white shadow-sm">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                              <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                            Sale
                          </span>
                        )}
                    </div>
                  )}
                    {/* Кнопка вишлиста */}
                    <button
                      type="button"
                      className={`absolute top-2 right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 md:bg-white/90 flex items-center justify-center transition-colors z-20 ${
                        isInWishlist(product.id) ? 'bg-white' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggle({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image_url: product.image_url,
                          original_price: (product as any).original_price || null,
                        })
                      }}
                      aria-label={isInWishlist(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      <svg
                        className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isInWishlist(product.id) ? 'fill-black stroke-black' : 'fill-none stroke-gray-400'}`}
                        fill="currentColor"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    
                    {/* Индикаторы точек пагинации для всех устройств */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {Array.from({ length: Math.min(imagesToDisplay.length, 8) }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
                              safeCurrentImageIdx === idx ? 'bg-white w-4 md:w-5' : 'bg-white/50'
                            }`}
                          />
                        ))}
                        {imagesToDisplay.length > 8 && (
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white/30" />
                        )}
                      </div>
                    )}
                </div>
                
                  <div className="pt-2 md:pt-3 min-w-0">
                    <div className="mb-1 text-black font-semibold text-base md:text-lg">
                      {(product as any).original_price && (
                        <span className="text-gray-400 line-through mr-2 text-sm md:text-base font-normal">
                          {(product as any).original_price.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                        </span>
                      )}
                      <span>{product.price.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}</span>
                    </div>
                    <h3 className="font-medium text-sm md:text-[15px] sm:md:text-[16px] leading-snug line-clamp-2 md:group-hover:text-black transition-colors text-black">
                    {product.name}
                  </h3>
                    {/* Свотчи цветов */}
                    {!!(product as any).colors?.length && (
                      <div className="mt-2 flex items-center gap-2">
                        {((product as any).colors as any[])?.slice(0,5).map((c, idx) => {
                          const value = typeof c === 'string' ? c : (c?.value ?? '')
                          const name = typeof c === 'string' ? c : (c?.name ?? '')
                          const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))
                          const common = `rounded-full border shadow-sm ${ (selectedVariantIndexById[product.id] || 0) === idx ? 'border-black ring-2 ring-black/10' : 'border-black/10'}`
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={(e) => { e.preventDefault(); setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: idx })) }}
                              className={`${common} overflow-hidden w-5 h-5 md:w-6 md:h-6`}
                              title={name || value}
                              style={isImage ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: value || '#eee' }}
                            />
                          )
                        })}
                        {((product as any).colors as any[])?.length > 5 && (
                          <span className="text-xs text-gray-500">+{((product as any).colors as any[]).length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Кнопка в корзину под названием; появляется по ховеру, не сдвигая соседей */}
                  <div className="hidden md:block pt-3 md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
                    <button
                      className="w-full bg-black text-white py-2.5 rounded-lg shadow-md hover:bg-gray-900"
                    >
                      Подробнее о товаре
                    </button>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

