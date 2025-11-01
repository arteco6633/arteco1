'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartContext'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Product {
  id: number
  name: string
  price: number
  image_url?: string | null
  original_price?: number | null
}

function SharedWishlistContent() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids')
  const { add } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProducts() {
      if (!idsParam) {
        setError('Не указаны товары для просмотра')
        setLoading(false)
        return
      }

      try {
        // Парсим ID товаров из параметра
        const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0)
        
        if (ids.length === 0) {
          setError('Неверный формат ссылки на вишлист')
          setLoading(false)
          return
        }

        // Загружаем товары из БД (без original_price, так как он может отсутствовать)
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', ids)

        if (supabaseError) {
          console.error('Supabase error:', supabaseError)
          console.error('Error details:', {
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint,
            code: supabaseError.code
          })
          throw new Error(supabaseError.message || 'Ошибка при загрузке товаров из базы данных')
        }

        if (!data || data.length === 0) {
          setError(`Товары с ID ${ids.join(', ')} не найдены`)
          setLoading(false)
          return
        }

        // Преобразуем данные
        const productsData = (data || []).map((p: any): Product => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url || null,
          original_price: null, // Не используем original_price, так как он может отсутствовать в схеме
        }))

        // Сортируем по порядку в URL
        const sortedProducts = ids
          .map(id => productsData.find(p => p.id === id))
          .filter((p) => p !== undefined) as Product[]

        if (sortedProducts.length === 0) {
          setError('Не удалось загрузить товары из вишлиста')
        } else {
          setProducts(sortedProducts)
        }
      } catch (err: any) {
        console.error('Ошибка загрузки товаров из вишлиста:', err)
        setError(err?.message || 'Не удалось загрузить вишлист. Проверьте правильность ссылки.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [idsParam])

  const handleAddToCart = (product: Product) => {
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || null,
    }, 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка вишлиста...</p>
        </div>
      </div>
    )
  }

  if (error || products.length === 0) {
    return (
      <div className="min-h-screen">
        <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
          <div className="bg-white border rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold mb-2">
              {error || 'Вишлист не найден'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Товары из этого вишлиста больше недоступны или ссылка неверна'}
            </p>
            <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-colors">
              Перейти в каталог →
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Поделенный вишлист</h1>
          <p className="text-gray-600">{`Найдено ${products.length} ${products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}`}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const discount = product.original_price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : 0

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <Link href={`/product/${product.id}`} className="block">
                  <div className="relative rounded-t-xl overflow-hidden aspect-square">
                    <img
                      src={product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-[16px] md:text-[18px] leading-6 text-gray-900 font-medium line-clamp-2 mb-3 hover:text-black transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </span>
                    {product.original_price && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through">
                        {product.original_price.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddToCart(product)
                    }}
                    className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors text-sm font-medium"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default function SharedWishlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <SharedWishlistContent />
    </Suspense>
  )
}

