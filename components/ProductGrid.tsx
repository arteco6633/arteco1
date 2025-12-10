'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/components/WishlistContext'
import dynamic from 'next/dynamic'

// Динамический импорт 3D просмотрщика - three.js очень тяжелый (~600KB)
const Product3DViewer = dynamic(() => import('@/components/Product3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-xs text-gray-500">Загрузка 3D...</span>
      </div>
    </div>
  ),
})

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
  is_new?: boolean
  is_featured?: boolean
  model_3d_url?: string | null
}

type Props = {
  products: Product[]
  splitTwoFirst?: boolean
  onlyFirstTwo?: boolean
  ctaRight?: React.ReactNode
  horizontal?: boolean
  onAdd?: (product: Product) => void
  hideButton?: boolean
  hideColors?: boolean
}

function Card({ product, onAdd, priority = false, fixedWidth, hideButton = false, hideColors = false }: { product: Product; onAdd?: (product: Product) => void; priority?: boolean; fixedWidth?: string; hideButton?: boolean; hideColors?: boolean }) {
  const { toggle, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(product.id)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      original_price: product.original_price,
    })
  }
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-lg border border-gray-200 transition-all duration-300 group md:hover:border-gray-300 block cursor-pointer h-full flex flex-col w-full"
      style={fixedWidth ? { 
        width: fixedWidth, 
        minWidth: fixedWidth, 
        maxWidth: fixedWidth,
        flexShrink: 0,
        boxSizing: 'border-box'
      } : {}}
    >
      {/* Обёртка для изображения с клипом только картинки, не тени */}
      <div className="relative rounded-t-lg overflow-hidden h-56 sm:h-64 md:h-72 bg-gray-100">
        {(() => {
          // Если есть 3D модель, показываем её
          if (product.model_3d_url) {
            return (
              <Product3DViewer 
                modelUrl={product.model_3d_url}
                autoRotate={false}
                className="rounded-t-lg"
              />
            )
          }
          
          // Иначе показываем обычное фото
          const src = (product.images && product.images.length > 0) ? product.images[0] : product.image_url
          if (!src) {
            return (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Нет фото
              </div>
            )
          }
          return (
            <Image
              src={src}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="transition-transform duration-300 ease-out md:group-hover:scale-[1.01] object-cover"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              unoptimized={true}
            />
          )
        })()}
        <button
          type="button"
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center md:hover:bg-white transition-colors ${inWishlist ? 'bg-white' : ''}`}
          onClick={handleWishlistClick}
          aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${inWishlist ? 'fill-black stroke-black' : 'fill-none stroke-gray-400'}`}
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {product.is_new && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-green-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold">
            NEW
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-10 left-2 sm:top-12 sm:left-3 bg-red-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 md:p-5 relative rounded-b-lg flex flex-col flex-grow min-h-[100px] sm:min-h-[110px] md:min-h-[120px]">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-base sm:text-lg md:text-xl lg:text-[22px] font-semibold text-gray-900">
            {product.price.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
          </span>
          {product.original_price && (
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-through">
              {product.original_price.toLocaleString('ru-RU')} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
            </span>
          )}
        </div>
        <h3 className="text-sm sm:text-base md:text-lg leading-5 sm:leading-6 text-gray-900/90 font-medium line-clamp-2 mb-2 sm:mb-3 flex-grow min-h-[2.5rem] sm:min-h-[3rem]">
          {product.name}
        </h3>
        {/* Свотчи цветов */}
        {!hideColors && !!product.colors?.length && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {product.colors.slice(0, 5).map((c, idx) => {
              const value = typeof c === 'string' ? c : (c?.value ?? '')
              const name = typeof c === 'string' ? c : (c?.name ?? '')
              const isImage = typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))
              return (
                <div
                  key={idx}
                  className="rounded-full border border-black/10 shadow-sm overflow-hidden w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                  title={name || value}
                  style={isImage ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: value || '#eee' }}
                />
              )
            })}
            {product.colors.length > 5 && (
              <span className="text-[10px] sm:text-xs text-gray-500">+{product.colors.length - 5}</span>
            )}
          </div>
        )}
        {!hideButton && (onAdd ? (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onAdd(product) }}
            className="w-full bg-black text-white py-2.5 sm:py-3 flex items-center justify-center transition-all duration-300 md:hover:bg-gray-900 rounded-[50px]"
            aria-label="Добавить в корзину"
          >
            <span className="text-lg sm:text-xl leading-none">+</span>
          </button>
        ) : (
          <span
            className="w-full bg-black text-white py-2.5 sm:py-3 flex items-center justify-center gap-2 transition-all duration-300 md:group-hover:bg-gray-900 rounded-[50px]"
            aria-hidden
          >
            <span className="text-sm sm:text-base font-medium">Смотреть</span>
            <span className="text-base sm:text-lg md:text-xl transform transition-transform duration-300 md:group-hover:translate-x-1">→</span>
          </span>
        ))}
      </div>
    </Link>
  )
}

export default function ProductGrid({ products, splitTwoFirst = false, onlyFirstTwo = false, ctaRight, horizontal = false, onAdd, hideButton = false, hideColors = false }: Props) {
  if (horizontal) {
    return (
      <div 
        className="overflow-x-auto scrollbar-hide"
        style={{
          touchAction: 'pan-x pan-y',
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex gap-3 sm:gap-4 md:gap-6 pb-2 items-stretch pr-1 sm:pr-2 md:pr-4">
          {products.map((p) => (
            <div 
              key={p.id} 
              className="flex flex-shrink-0 w-[280px] min-w-[280px] max-w-[280px] sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px] md:w-[360px] md:min-w-[360px] md:max-w-[360px]"
              style={{ 
                boxSizing: 'border-box'
              }}
            >
              <Card product={p} onAdd={onAdd} hideButton={hideButton} hideColors={hideColors} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (onlyFirstTwo) {
    const firstTwoOnly = products.slice(0, 2)
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-7 overflow-visible max-w-full">
        {firstTwoOnly.map((p, index) => (
          <Card key={p.id} product={p} onAdd={onAdd} priority={index < 2} hideButton={hideButton} hideColors={hideColors} />
        ))}
      </div>
    )
  }

  if (!splitTwoFirst) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-7 overflow-visible max-w-full">
        {products.map((p) => (
          <Card key={p.id} product={p} onAdd={onAdd} hideButton={hideButton} hideColors={hideColors} />
        ))}
        {ctaRight}
      </div>
    )
  }

  const firstTwo = products.slice(0, 2)
  const rest = products.slice(2)

  // Определяем количество колонок для нижних товаров
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }
  const colsClass = colsMap[rest.length] || 'grid-cols-3'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-7">
        {firstTwo.map((p) => (
          <Card key={p.id} product={p} onAdd={onAdd} hideButton={hideButton} hideColors={hideColors} />
        ))}
      </div>
      {rest.length > 0 && (
        <div className={`grid ${colsClass} gap-4 sm:gap-7`}>
          {rest.map((p) => (
            <Card key={p.id} product={p} onAdd={onAdd} hideButton={hideButton} hideColors={hideColors} />
          ))}
        </div>
      )}
    </div>
  )
}

