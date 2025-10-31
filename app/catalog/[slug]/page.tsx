'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  // Выбранные варианты цветов/изображений по товару (индекс)
  const [selectedVariantIndexById, setSelectedVariantIndexById] = useState<Record<number, number>>({})

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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-8">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="group block relative hover:z-10 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative z-10 p-3">
                  <div
                    className="relative rounded-xl overflow-hidden"
                    onMouseMove={createHoverScrubHandler(product.id, ((product as any).images as string[] | undefined)?.length || 0)}
                    onMouseLeave={() => setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: 0 }))}
                  >
                    <img
                      src={(() => {
                        const imgs = (product as any).images as string[] | undefined
                        const idx = selectedVariantIndexById[product.id] || 0
                        return (imgs && imgs[idx]) || (imgs && imgs[0]) || product.image_url || '/placeholder.jpg'
                      })()}
                      alt={product.name}
                      className="w-full aspect-[3/2] object-cover group-hover:scale-[1.02] transition-transform duration-300"
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
                  </div>

                  <div className="pt-3 min-w-0">
                    <div className="mb-1 text-black font-semibold text-lg">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <h3 className="font-medium text-[15px] sm:text-[16px] leading-snug line-clamp-2 group-hover:text-black transition-colors">
                      {product.name}
                    </h3>
                    {/* Свотчи цветов */}
                    {!!(product as any).colors?.length && (
                      <div className="mt-2 flex items-center gap-2">
                        {((product as any).colors as any[])?.slice(0,5).map((c, idx) => {
                          const value = typeof c === 'string' ? c : (c?.value ?? '')
                          const name = typeof c === 'string' ? c : (c?.name ?? '')
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={(e) => { e.preventDefault(); setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: idx })) }}
                              className={`w-5 h-5 md:w-6 md:h-6 rounded-full border shadow-sm ${ (selectedVariantIndexById[product.id] || 0) === idx ? 'border-black ring-2 ring-black/10' : 'border-black/10'}`}
                              style={{ background: value || '#eee' }}
                              title={name || value}
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
                  <div className="pt-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      className="w-full bg-black text-white py-2.5 rounded-lg shadow-md hover:bg-gray-900"
                      onClick={(e) => e.preventDefault()}
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

