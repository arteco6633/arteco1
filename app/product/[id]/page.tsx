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
  category_id: number
  is_featured: boolean
  is_new: boolean
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function ProductPage() {
  const params = useParams()
  const id = params?.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

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
    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
    } finally {
      setLoading(false)
    }
  }

  function addToCart() {
    // TODO: Реализовать добавление в корзину
    alert(`Добавлено в корзину: ${quantity} шт.`)
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

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
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
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/catalog/${category.slug}`} className="hover:text-gray-700">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Изображение */}
          <div>
            <img
              src={product.image_url || '/placeholder.jpg'}
              alt={product.name}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Информация о товаре */}
          <div>
            {category && (
              <Link
                href={`/catalog/${category.slug}`}
                className="inline-block text-blue-600 hover:underline mb-2"
              >
                ← {category.name}
              </Link>
            )}

            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

            {product.description && (
              <p className="text-gray-600 text-lg mb-6">{product.description}</p>
            )}

            <div className="flex gap-2 mb-6">
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

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-4">
                {product.price} ₽
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="font-semibold">Количество:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border rounded-lg hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border rounded-lg"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border rounded-lg hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={addToCart}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                В корзину
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p>✓ Бесплатная доставка по городу</p>
              <p>✓ Самовывоз из шоурумов</p>
              <p>✓ Гарантия качества</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 ARTECO. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}

