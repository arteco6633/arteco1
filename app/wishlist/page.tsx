'use client'

import Link from 'next/link'
import { useWishlist } from '@/components/WishlistContext'
import { useCart } from '@/components/CartContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: number
  name: string
  price: number
  image_url?: string | null
  original_price?: number | null
}

export default function WishlistPage() {
  const { items: wishlistItems, remove } = useWishlist()
  const { add } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      if (wishlistItems.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const ids = wishlistItems.map(item => item.id)
        if (ids.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', ids)

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        // Преобразуем данные с учетом отсутствия original_price
        const productsData = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          original_price: p.original_price || null,
        }))

        setProducts(productsData)
      } catch (err) {
        console.error('Ошибка загрузки товаров из вишлиста:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [wishlistItems])

  const handleAddToCart = (product: Product) => {
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || null,
      qty: 1,
    })
  }

  const handleShareWishlist = async () => {
    if (wishlistItems.length === 0) {
      alert('Ваш вишлист пуст. Добавьте товары, чтобы поделиться.')
      return
    }

    // Формируем ссылку с ID всех товаров из вишлиста
    const productIds = wishlistItems.map(item => item.id).join(',')
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/wishlist/share?ids=${productIds}` 
      : ''
    
    const shareData = {
      title: 'Мой вишлист из ARTECO',
      text: `Посмотрите мой вишлист из ${wishlistItems.length} ${wishlistItems.length === 1 ? 'товара' : wishlistItems.length < 5 ? 'товаров' : 'товаров'} в ARTECO`,
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
          // Fallback на копирование
          try {
            await navigator.clipboard.writeText(url)
            alert('Ссылка скопирована в буфер обмена!')
          } catch (copyErr) {
            console.error('Ошибка копирования:', copyErr)
          }
        }
      }
    } else {
      // Fallback для десктопа: копируем ссылку в буфер обмена
      try {
        await navigator.clipboard.writeText(url)
        alert('Ссылка на вишлист скопирована в буфер обмена!')
      } catch (err) {
        console.error('Ошибка копирования в буфер обмена:', err)
        // Альтернативный способ: показываем модалку с ссылкой
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        alert('Ссылка на вишлист скопирована в буфер обмена!')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Избранное</h1>
            <p className="text-gray-600">{wishlistItems.length > 0 ? `Найдено ${wishlistItems.length} ${wishlistItems.length === 1 ? 'товар' : wishlistItems.length < 5 ? 'товара' : 'товаров'}` : 'У вас пока нет избранных товаров'}</p>
          </div>
          {wishlistItems.length > 0 && (
            <button
              type="button"
              onClick={handleShareWishlist}
              className="px-6 py-3 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Поделиться вишлистом
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-semibold mb-2">Ваш список избранного пуст</h2>
            <p className="text-gray-600 mb-6">Добавьте товары в избранное, чтобы легко найти их позже</p>
            <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-colors">
              Перейти в каталог →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {wishlistItems.map((wishlistItem) => {
              const product = products.find(p => p.id === wishlistItem.id)
              if (!product) return null

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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          remove(product.id)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Удалить
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product)
                        }}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors text-sm font-medium"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

