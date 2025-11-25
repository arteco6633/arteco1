'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number | null
  price_type?: 'fixed' | 'per_m2' | null
  image_url: string
  images?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
}

export default function FamilyPricePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  // Typewriter animation for "team"
  useEffect(() => {
    const fullText = 'team'
    let currentIndex = 0
    let isDeleting = false
    let typingSpeed = 100
    let timeoutId: NodeJS.Timeout

    const type = () => {
      if (!isDeleting && currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex))
        currentIndex++
        typingSpeed = 100
      } else if (isDeleting && currentIndex >= 0) {
        setTypedText(fullText.substring(0, currentIndex))
        currentIndex--
        typingSpeed = 50
      }

      if (currentIndex === fullText.length + 1) {
        // Пауза перед началом удаления
        typingSpeed = 2000
        isDeleting = true
      } else if (currentIndex === -1) {
        // Пауза перед началом печатания
        typingSpeed = 500
        isDeleting = false
        currentIndex = 0
      }

      timeoutId = setTimeout(type, typingSpeed)
    }

    type()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(6)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateDiscount(price: number, originalPrice?: number | null) {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section - Minimalist */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-gray-100">
        {/* Content */}
        <div className="relative z-10 max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12 py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 border border-gray-300 bg-white rounded-md">
            <span className="text-xs tracking-[0.2em] uppercase text-gray-600 font-medium">Эксклюзивная программа</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light text-black mb-8 leading-[1.1] tracking-tight">
            ARTECO.<span className="inline-block">{typedText}<span className="inline-block w-[2px] h-[0.9em] bg-black ml-1.5 animate-blink align-bottom"></span></span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-light tracking-wide">
            Скидки до 10% на кухни и технику для участников программы
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('open-auth'))
                }
              }}
              className="px-12 py-4 bg-black text-white font-normal text-base tracking-wide hover:bg-gray-900 transition-colors duration-200 uppercase tracking-[0.1em] rounded-md"
            >
              Получить скидку
            </button>
            <Link
              href="/catalog"
              className="px-12 py-4 bg-white text-black font-normal text-base border border-black hover:bg-black hover:text-white transition-all duration-200 uppercase tracking-[0.1em] rounded-md"
            >
              Смотреть каталог
            </Link>
          </div>

          {/* Stats - Minimalist */}
          <div className="grid grid-cols-3 gap-12 max-w-2xl mx-auto mt-24 pt-12 border-t border-gray-200">
            <div>
              <div className="text-5xl md:text-6xl font-light text-black mb-3 tracking-tight">10%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Скидка</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light text-black mb-3 tracking-tight">500+</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Семей</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-light text-black mb-3 tracking-tight">24/7</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Minimalist */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Почему выбирают нас
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto font-light">
              Выгодные условия для всей семьи с моментальной активацией
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center border border-gray-300 bg-white rounded-md">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-4 tracking-wide">Скидка 10%</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                Специальная скидка на все товары из каталога кухонь и бытовой техники
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center border border-gray-300 bg-white rounded-md">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-4 tracking-wide">Накопительные бонусы</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                Копите бонусы с каждой покупки и используйте их для следующих заказов
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center border border-gray-300 bg-white rounded-md">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-4 tracking-wide">Приоритетная доставка</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                Быстрая доставка и сборка в удобное для вас время с индивидуальным подходом
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimalist */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Как это работает
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto font-light">
              Всего 3 простых шага до вашей скидки
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Зарегистрируйтесь',
                description: 'Создайте аккаунт через телефон или Яндекс ID - это займет всего 1 минуту'
              },
              {
                step: '02',
                title: 'Активируйте программу',
                description: 'Скидка активируется автоматически сразу после регистрации'
              },
              {
                step: '03',
                title: 'Покупайте со скидкой',
                description: 'Выбирайте товары и оформляйте заказ - скидка применяется автоматически'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="text-7xl font-light text-gray-200 mb-6 tracking-tight">{item.step}</div>
                  <h3 className="text-xl font-light text-black mb-4 tracking-wide">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2">
                    <div className="w-px h-16 bg-gray-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section - Minimalist */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Товары со скидкой
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto font-light">
              Посмотрите примеры товаров, на которые распространяется семейная скидка
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const discount = calculateDiscount(product.price, product.original_price)
                const discountPrice = product.original_price 
                  ? Math.round(product.price * 0.9) 
                  : Math.round(product.price * 0.9)
                
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group bg-white border border-gray-200 hover:border-black transition-colors duration-200 rounded-lg overflow-hidden"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {discount > 0 && (
                        <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-normal uppercase tracking-wider rounded-md">
                          -{discount}%
                        </div>
                      )}
                      {product.is_new && (
                        <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 text-xs font-normal uppercase tracking-wider border border-black rounded-md">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-light text-black mb-2 group-hover:underline transition-all">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 font-light">
                        {product.description}
                      </p>
                      <div className="flex items-baseline gap-3 mb-2">
                        {product.original_price ? (
                          <>
                            <span className="text-2xl font-light text-black">
                              {formatPrice(discountPrice)} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                            </span>
                            <span className="text-sm text-gray-400 line-through font-light">
                              {formatPrice(product.original_price)} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-light text-black">
                              {formatPrice(discountPrice)} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                            </span>
                            <span className="text-xs text-gray-500 font-light">
                              (было {formatPrice(product.price)} {product.price_type === 'per_m2' ? '₽/м²' : '₽'})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-4 text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Экономия {formatPrice(product.original_price ? product.original_price - discountPrice : product.price - discountPrice)} {product.price_type === 'per_m2' ? '₽/м²' : '₽'}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 font-light">
              Товары загружаются...
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-3 px-12 py-4 bg-black text-white font-normal text-sm uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors duration-200 rounded-md"
            >
              <span>Смотреть весь каталог</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section - Minimalist */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Интерьеры наших клиентов
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto font-light">
              Вдохновитесь реальными примерами кухонь, созданных с любовью
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'https://images.unsplash.com/photo-1556912172-45b7abe8b7e8?w=800',
              'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
              'https://images.unsplash.com/photo-1556912172-45b7abe8b7e8?w=800',
              'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
            ].map((src, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] overflow-hidden border border-gray-200 hover:border-black transition-colors duration-200 group rounded-lg"
              >
                <Image
                  src={src}
                  alt={`Интерьер ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Minimalist */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-12 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-8 tracking-tight">
            Готовы начать экономить?
          </h2>
          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light text-gray-300">
            Присоединяйтесь к программе ARTECO.team и получите скидку 10% на первую покупку
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('open-auth'))
                }
              }}
              className="px-12 py-4 bg-white text-black font-normal text-sm uppercase tracking-[0.1em] hover:bg-gray-100 transition-colors duration-200 rounded-md"
            >
              Получить скидку сейчас
            </button>
            <Link
              href="/catalog"
              className="px-12 py-4 bg-black text-white font-normal text-sm uppercase tracking-[0.1em] border border-white hover:bg-white hover:text-black transition-all duration-200 rounded-md"
            >
              Посмотреть каталог
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto pt-12 border-t border-gray-800">
            <div className="text-center">
              <div className="text-5xl font-light mb-3 tracking-tight">10%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Скидка на все товары</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light mb-3 tracking-tight">0₽</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Стоимость участия</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light mb-3 tracking-tight">∞</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Без ограничений</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
