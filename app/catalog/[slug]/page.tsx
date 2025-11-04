'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useWishlist } from '@/components/WishlistContext'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
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
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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
    
    // Определяем направление на раннем этапе (первые 10-15px движения)
    // Более строгое условие: горизонтальное движение должно быть в 2.5 раза больше вертикального
    if (diffX > 10 && diffX > diffY * 2.5) {
      // Устанавливаем флаг горизонтального свайпа
      if (!isHorizontalSwipe[productId]) {
        setIsHorizontalSwipe((prev) => ({ ...prev, [productId]: true }))
      }
      // Обновляем конечные позиции для обработки свайпа
      setTouchEndX((prev) => ({ ...prev, [productId]: touch.clientX }))
      setTouchEndY((prev) => ({ ...prev, [productId]: touch.clientY }))
      // Не используем preventDefault() - вместо этого полагаемся на CSS touch-action
      // CSS touch-action: pan-y pinch-zoom уже настроен, что блокирует горизонтальную прокрутку страницы
    } else if (diffY > 10 && diffY > diffX * 1.5) {
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
    const minDistance = duration < 300 ? 25 : 40 // Быстрый свайп требует меньше расстояния
    const minVelocity = 0.25 // Минимальная скорость для быстрого свайпа
    
    const distance = Math.abs(diff)
    const velocity = distance / Math.max(duration, 1)
    
    // Учитываем только горизонтальные свайпы (если флаг установлен или движение горизонтальное)
    const isDefinitelyHorizontal = isHorizontal || (Math.abs(diff) > Math.abs(diffY) * 1.5)
    
    if (isDefinitelyHorizontal && (distance > minDistance || velocity > minVelocity)) {
      const currentIdx = selectedVariantIndexById[productId] || 0
      
      if (diff > 0) {
        // Свайп влево - следующее изображение
        const nextIdx = Math.min(imagesLength - 1, currentIdx + 1)
        setSelectedVariantIndexById((prev) => ({
          ...prev,
          [productId]: nextIdx
        }))
      } else {
        // Свайп вправо - предыдущее изображение
        const prevIdx = Math.max(0, currentIdx - 1)
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
    if (slug) {
      loadCategoryData()
    }
  }, [slug])

  async function loadCategoryData() {
    try {
      // Загружаем категорию
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!categoryData) {
        setLoading(false)
        return
      }

      setCategory(categoryData)

      // Загружаем товары этой категории
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryData.id)
        .order('id', { ascending: false })

      setProducts(productsData || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
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
      <main className="mx-auto max-w-[1400px] 2xl:max-w-[1600px] px-4 md:px-3 xl:px-6 2xl:px-9 py-6 md:py-8">
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
              const imagesLength = images?.length || 0
              const currentImageIdx = selectedVariantIndexById[product.id] || 0
              const hasMultipleImages = imagesLength > 1
              
              return (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="group block relative hover:z-10 md:rounded-2xl bg-transparent md:bg-white md:border md:border-gray-100 md:shadow-sm md:hover:shadow-lg transition-shadow duration-300 md:min-h-[460px]"
              >
                <div className="relative z-10 p-0 md:px-3 md:pt-3 md:pb-3">
                  <div
                    className="relative overflow-hidden"
                    style={{ 
                      // Используем pan-y для разрешения только вертикальной прокрутки
                      // pinch-zoom для масштабирования
                      // none для блокировки горизонтальной прокрутки страницы
                      touchAction: imagesLength > 1 ? 'pan-y pinch-zoom' : 'auto',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      // Добавляем will-change для оптимизации
                      willChange: imagesLength > 1 ? 'transform' : 'auto'
                    }}
                    onMouseMove={createHoverScrubHandler(product.id, imagesLength)}
                    onMouseLeave={() => setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: 0 }))}
                    onTouchStart={(e) => {
                      if (imagesLength > 1) {
                        handleTouchStart(product.id, e)
                      }
                    }}
                    onTouchMove={(e) => {
                      if (imagesLength > 1) {
                        handleTouchMove(product.id, e)
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (imagesLength > 1) {
                        handleTouchEnd(product.id, imagesLength)
                      }
                    }}
                  >
                    <img
                      src={(images && images[currentImageIdx]) || (images && images[0]) || product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full aspect-[4/5] md:aspect-[4/3] object-cover rounded-xl md:group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                    {(product.is_new || product.is_featured) && (
                      <div className="absolute top-2 left-2 flex gap-2">
                        {product.is_new && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            NEW
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            ⭐
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
                    
                    {/* Индикаторы точек для свайпа на мобильных */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                        {Array.from({ length: Math.min(imagesLength, 5) }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              currentImageIdx === idx ? 'bg-white w-4' : 'bg-white/50'
                            }`}
                          />
                        ))}
                        {imagesLength > 5 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 md:pt-3 min-w-0">
                    <div className="mb-1 text-black font-semibold text-base md:text-lg">
                      {product.price.toLocaleString('ru-RU')} ₽
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

