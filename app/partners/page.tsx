'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number | null
  image_url: string
  images?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
}

export default function PartnersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typedTeam, setTypedTeam] = useState('')
  const isMountedRef = useRef(true)

  useEffect(() => {
    loadProducts()
    loadWishlistProducts()
  }, [])


  // Typewriter animation for "team"
  useEffect(() => {
    isMountedRef.current = true
    const fullText = 'team'
    let currentIndex = 0
    let isDeleting = false
    let typingSpeed = 100
    const timeouts: NodeJS.Timeout[] = []
    let cancelled = false

    const type = () => {
      if (cancelled || !isMountedRef.current) return

      try {
        if (!isDeleting && currentIndex <= fullText.length) {
          if (isMountedRef.current && !cancelled) {
            setTypedTeam(fullText.substring(0, currentIndex))
          }
          currentIndex++
          typingSpeed = 100
        } else if (isDeleting && currentIndex >= 0) {
          if (isMountedRef.current && !cancelled) {
            setTypedTeam(fullText.substring(0, currentIndex))
          }
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

        if (isMountedRef.current && !cancelled) {
          const timeoutId = setTimeout(type, typingSpeed) as NodeJS.Timeout
          timeouts.push(timeoutId)
        }
      } catch (error) {
        // Игнорируем ошибки при переводе страницы
        console.warn('Animation error (ignored):', error)
      }
    }

    type()

    // Обработчик изменения языка/перевода
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelled = true
        timeouts.forEach(timeout => clearTimeout(timeout))
      }
    }

    const handleLanguageChange = () => {
      cancelled = true
      timeouts.forEach(timeout => clearTimeout(timeout))
    }

    // Обработчик изменения DOM (для переводчика браузера)
    const observer = new MutationObserver((mutations) => {
      // Проверяем, не является ли изменение результатом работы переводчика
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'translate' || mutation.attributeName === 'lang')) {
          cancelled = true
          timeouts.forEach(timeout => clearTimeout(timeout))
          return
        }
        // Проверяем добавление элементов с атрибутом translate
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && 
                ((node as Element).hasAttribute('translate') || 
                 (node as Element).querySelector('[translate]'))) {
              cancelled = true
              timeouts.forEach(timeout => clearTimeout(timeout))
              return
            }
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['translate', 'lang']
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleLanguageChange)

    return () => {
      cancelled = true
      isMountedRef.current = false
      timeouts.forEach(timeout => clearTimeout(timeout))
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleLanguageChange)
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

  async function loadWishlistProducts() {
    try {
      const wishlistNames = ['Комод Вегас', 'Кровать Лона', 'Кухня Мона Лиза']
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('name', wishlistNames)

      if (error) throw error
      
      // Сортируем в нужном порядке
      const sortedProducts = wishlistNames
        .map(name => data?.find(p => p.name === name))
        .filter(Boolean) as Product[]
      
      setWishlistProducts(sortedProducts)
    } catch (error) {
      console.error('Ошибка загрузки товаров вишлиста:', error)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  return (
    <div className="min-h-screen w-full modern-2025-bg overflow-x-hidden m-0 p-0">
      {/* Hero Section - Minimalist */}
      <section className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-gray-100/50 z-10">
        {/* Content */}
        <div className="relative z-10 max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 sm:py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 border border-gray-300 bg-white rounded-[50px]">
            <span className="text-xs tracking-[0.2em] uppercase text-gray-600 font-medium">Партнёрская программа</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-black mb-6 sm:mb-8 leading-[1.1] tracking-tight">
            arteco.<span className="relative inline-block">{typedTeam}<span className="inline-block w-[2px] h-[0.9em] bg-black ml-1.5 animate-blink align-bottom" suppressHydrationWarning></span></span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 sm:mb-12 max-w-none mx-auto font-light tracking-wide whitespace-nowrap overflow-x-auto">
            Реализуем дизайн вместе
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20">
            <Link
              href="/partners/register"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-sm sm:text-base tracking-wide hover:bg-gray-900 transition-colors duration-200 uppercase tracking-[0.1em] rounded-[50px] animate-subtle-glow animate-soft-breath w-full sm:w-auto"
            >
              Стать партнером
            </Link>
            <Link
              href="/partners/login"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-white text-black font-normal text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-all duration-200 uppercase tracking-[0.1em] rounded-[50px] animate-border-pulse animate-soft-breath w-full sm:w-auto"
            >
              Войти в кабинет
            </Link>
          </div>

          {/* Stats - Minimalist - Empty block to maintain spacing */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 md:gap-12 max-w-2xl mx-auto mt-12 sm:mt-16 md:mt-24 pt-6 sm:pt-8 md:pt-12">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Minimalist */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50 relative">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Cards - Left */}
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
            {/* Benefit 1 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-light text-black mb-1 sm:mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Комиссия 10%</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Получайте 10% комиссии с каждого заказа, который вы привели. Выплаты производятся ежемесячно
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-light text-black mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Сопровождение клиента</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Мы полностью сопровождаем вашего клиента на каждом этапе: от консультации до доставки и сборки
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group relative p-4 sm:p-5 md:p-6 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4 sm:gap-5 md:gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 flex items-center justify-center border border-gray-300 bg-white rounded-[50px] group-hover:border-black group-hover:shadow-lg transition-all duration-500 group-hover:scale-110">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-light text-black mb-2 tracking-wide group-hover:font-normal transition-all duration-300">Личный кабинет</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light group-hover:text-gray-700 transition-colors duration-300">
                    Отслеживайте статус заказов ваших клиентов, статистику и начисленные комиссии в реальном времени
                  </p>
                </div>
              </div>
            </div>
              </div>
            </div>

            {/* Text - Right */}
            <div className="relative order-1 lg:order-2 lg:pl-8 mb-8 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                ARTECO.<span className="relative inline-block">{typedTeam}<span className="inline-block w-[2px] h-[0.9em] bg-black ml-1.5 animate-blink align-bottom" suppressHydrationWarning></span></span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed">
                Выгодные условия для партнёров с прозрачной системой выплат
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Account Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Text - Left */}
            <div className="relative order-1 lg:order-1 lg:pr-8 mb-8 lg:mb-0 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                Кабинет партнера
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-8">
                Отслеживайте статус и комисси в реальном времени
              </p>
            </div>

            {/* Dashboard Preview - Right */}
            <div className="relative order-2 lg:order-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 font-light">Заказов</div>
                    <div className="text-xl sm:text-2xl font-light text-black">24</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2 font-light">Комиссия</div>
                    <div className="text-xl sm:text-2xl font-light text-black">125,000₽</div>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm font-light text-gray-600 mb-2 sm:mb-3">Последние заказы</div>
                  {[
                    { id: '#12345', status: 'Оплачен', amount: '45,000₽', date: '12.01.2025' },
                    { id: '#12344', status: 'В обработке', amount: '32,000₽', date: '11.01.2025' },
                    { id: '#12343', status: 'Доставлен', amount: '28,000₽', date: '10.01.2025' },
                  ].map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                          <span className="text-xs sm:text-sm font-light text-black truncate">{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-light flex-shrink-0 ${
                            order.status === 'Оплачен' ? 'bg-green-100 text-green-700' :
                            order.status === 'В обработке' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-light">{order.date}</div>
                      </div>
                      <div className="text-xs sm:text-sm font-light text-black ml-2 flex-shrink-0">{order.amount}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-xs sm:text-sm font-light text-gray-600 mb-2 sm:mb-3">Статистика за месяц</div>
                  <div className="h-24 sm:h-28 md:h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-end justify-around p-2 sm:p-3 md:p-4">
                    {[40, 65, 45, 80, 55, 70, 60].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-black rounded-t-sm transition-all duration-300 hover:bg-gray-700"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-light">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Wishlist Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Wishlist Share Preview - Left */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Wishlist Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.312-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-light text-black truncate">Мой вишлист</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-light">5 товаров</div>
                    </div>
                  </div>
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white text-[10px] sm:text-xs font-light rounded-full hover:bg-gray-800 transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />
                    </svg>
                    Поделиться
                  </button>
                </div>

                {/* Wishlist Items */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {wishlistProducts.length > 0 ? (
                    wishlistProducts.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized={item.image_url?.includes('unsplash') || false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-light text-black truncate">{item.name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-light">{formatPrice(item.price)} ₽</div>
                        </div>
                        <button className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    // Fallback если товары еще не загружены
                    ['Комод Вегас', 'Кровать Лона', 'Кухня Мона Лиза'].map((name, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-light text-black truncate">{name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-light">Загрузка...</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Share Options */}
                <div className="pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-light mb-2 sm:mb-3">Поделиться через:</div>
                  <div className="flex flex-wrap gap-2">
                    {['WhatsApp', 'Telegram', 'Email', 'Копировать'].map((platform, index) => (
                      <button key={index} className="flex-1 min-w-[calc(50%-4px)] sm:min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-xs font-light text-black hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200">
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text - Right */}
            <div className="relative order-1 lg:order-2 lg:pl-8 mb-8 lg:mb-0 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                Вишлист клиентам
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-8">
                Создавайте списки желаний и делитесь ими с клиентами
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Products Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Text - Left */}
            <div className="relative order-1 lg:order-1 lg:pr-8 mb-8 lg:mb-0 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-4 sm:mb-6 tracking-tight">
                В курсе новостей
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed mb-8">
                Узнавайте о новых товара и предложениях первыми
              </p>
            </div>

            {/* Visualization - Right */}
            <div className="relative order-2 lg:order-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Notification Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-light text-black truncate">Уведомления</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-light">3 новых</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                </div>

                {/* Notifications List */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {[
                    { 
                      title: 'Новая коллекция кухонь', 
                      description: 'Добавлено 12 новых моделей', 
                      time: '5 минут назад', 
                      iconType: 'new' 
                    },
                    { 
                      title: 'Специальное предложение', 
                      description: 'Скидка до 15% на все шкафы', 
                      time: '1 час назад', 
                      iconType: 'offer' 
                    },
                    { 
                      title: 'Новинка в каталоге', 
                      description: 'Комод Вегас - теперь доступен', 
                      time: '2 часа назад', 
                      iconType: 'product' 
                    },
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {notification.iconType === 'new' && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        )}
                        {notification.iconType === 'offer' && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                          </svg>
                        )}
                        {notification.iconType === 'product' && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.533A9 9 0 1021.75 12c0-1.81-.53-3.5-1.44-4.913L11.25 4.533zM12 9a3 3 0 100 6 3 3 0 000-6z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-light text-black mb-1 truncate">{notification.title}</div>
                        <div className="text-[10px] sm:text-xs text-gray-600 font-light mb-1">{notification.description}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400 font-light">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notification Settings */}
                <div className="pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-light mb-2 sm:mb-3">Настройки уведомлений</div>
                  <div className="space-y-2">
                    {['Новые товары', 'Специальные предложения', 'Акции и скидки'].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-[10px] sm:text-xs font-light text-black">{setting}</span>
                        <div className="relative inline-block w-10 h-6 rounded-full bg-black cursor-pointer flex-shrink-0">
                          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Minimalist */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-4 sm:mb-6 tracking-tight">
              Популярные товары
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-light px-4">
              Посмотрите примеры товаров, которые вы можете рекомендовать своим клиентам
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-black"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {products.map((product) => (
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
                    {product.is_new && (
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white text-black px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-normal uppercase tracking-wider border border-black rounded-md">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 md:p-6">
                    <h3 className="text-base sm:text-lg font-light text-black mb-2 group-hover:underline transition-all">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 font-light">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl sm:text-2xl font-light text-black">
                        {formatPrice(product.price)} ₽
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 font-light">
              Товары загружаются...
            </div>
          )}

          <div className="text-center mt-12 sm:mt-16">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-xs sm:text-sm uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors duration-200 rounded-md"
            >
              <span>Смотреть весь каталог</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section - Minimalist */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-100/50">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-4 sm:mb-6 tracking-tight">
              Интерьеры наших клиентов
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-light px-4">
              Вдохновитесь реальными примерами кухонь, созданных с любовью
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-black text-white">
        <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-8 tracking-tight">
            Готовы стать партнёром?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto font-light text-gray-300 px-4">
            Присоединяйтесь к партнёрской программе ARTECO и получайте комиссию с каждого заказа
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 md:mb-20">
            <Link
              href="/partners/register"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-white text-black font-normal text-xs sm:text-sm uppercase tracking-[0.1em] hover:bg-gray-100 transition-colors duration-200 rounded-[50px] animate-border-pulse animate-soft-breath w-full sm:w-auto"
            >
              Стать партнером сейчас
            </Link>
            <Link
              href="/partners/login"
              className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-black text-white font-normal text-xs sm:text-sm uppercase tracking-[0.1em] border border-white hover:bg-white hover:text-black transition-all duration-200 rounded-[50px] animate-subtle-glow animate-soft-breath w-full sm:w-auto"
            >
              Войти в кабинет
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-3xl mx-auto pt-8 sm:pt-10 md:pt-12 border-t border-gray-800">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">10%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Комиссия с заказа</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">0₽</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Стоимость участия</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-light mb-2 sm:mb-3 tracking-tight">∞</div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Без ограничений</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
