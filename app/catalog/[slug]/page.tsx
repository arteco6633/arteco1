'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
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
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen">
        <Navbar />
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
      <Navbar />
      
      <main className="mx-auto max-w-[1680px] px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-1 md:gap-y-2">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="group block relative hover:z-10 p-3"
              >
                {/* Белый фон появляется только при ховере и не смещает соседей */}
                <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white shadow-xl ring-1 ring-black/5"></div>
                <div className="relative z-10">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={(() => {
                        const imgs = (product as any).images as string[] | undefined
                        const idx = selectedVariantIndexById[product.id] || 0
                        return (imgs && imgs[idx]) || (imgs && imgs[0]) || product.image_url || '/placeholder.jpg'
                      })()}
                      alt={product.name}
                      className="w-full h-56 md:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
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

                  <div className="pt-3">
                    <div className="mb-1 text-black font-semibold text-lg whitespace-nowrap">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <h3 className="font-medium text-[16px] leading-snug line-clamp-2 group-hover:text-black transition-colors">
                      {product.name}
                    </h3>
                    {/* Свотчи цветов */}
                    {!!(product as any).colors?.length && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {((product as any).colors as string[])?.slice(0,5).map((c, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={(e) => { e.preventDefault(); setSelectedVariantIndexById((prev) => ({ ...prev, [product.id]: idx })) }}
                            className={`w-4 h-4 rounded-full border ${ (selectedVariantIndexById[product.id] || 0) === idx ? 'border-black' : 'border-black/10'}`}
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                        {((product as any).colors as string[])?.length > 5 && (
                          <span className="text-xs text-gray-500">+{((product as any).colors as string[]).length - 5}</span>
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

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 ARTECO. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}

