import Link from 'next/link'

interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number
  image_url: string
  category_id: number
  is_new?: boolean
  is_featured?: boolean
}

type Props = {
  products: Product[]
  splitTwoFirst?: boolean
  onlyFirstTwo?: boolean
}

function Card({ product }: { product: Product }) {
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-xl shadow-md transition-all duration-300 group hover:-translate-y-1.5 hover:shadow-xl hover:ring-1 hover:ring-black/10 block cursor-pointer"
    >
      {/* Обёртка для изображения с клипом только картинки, не тени */}
      <div className="relative rounded-t-xl overflow-hidden">
        <img
          src={product.image_url || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-60 sm:h-72 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors" onClick={(e) => e.preventDefault()}>
          <span className="text-xl">♡</span>
        </button>
        {product.is_new && (
          <span className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            NEW
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-12 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5 pr-16 relative rounded-b-xl">
        <h3 className="text-[16px] md:text-[18px] leading-6 text-gray-900/90 font-medium line-clamp-2 mb-3">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {product.original_price && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              {product.original_price.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <span
          className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black text-white flex items-center justify-center shadow-md transition-all duration-300 group-hover:bg-gray-900 group-hover:shadow-lg"
          aria-hidden
        >
          <span className="text-lg sm:text-xl transform transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}

export default function ProductGrid({ products, splitTwoFirst = false, onlyFirstTwo = false }: Props) {
  if (onlyFirstTwo) {
    const firstTwoOnly = products.slice(0, 2)
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-7 overflow-visible max-w-full">
        {firstTwoOnly.map((p) => (
          <Card key={p.id} product={p} />
        ))}
      </div>
    )
  }

  if (!splitTwoFirst) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-7 overflow-visible max-w-full">
        {products.map((p) => (
          <Card key={p.id} product={p} />
        ))}
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
          <Card key={p.id} product={p} />
        ))}
      </div>
      {rest.length > 0 && (
        <div className={`grid ${colsClass} gap-4 sm:gap-7`}>
          {rest.map((p) => (
            <Card key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

