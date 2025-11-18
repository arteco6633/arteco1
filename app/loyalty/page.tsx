'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  price: number
  image_url?: string | null
  images?: string[] | null
}

export default function LoyaltyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [visibleCards, setVisibleCards] = useState<boolean[]>([])
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [cartProducts, setCartProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const benefitCards = [
    {
      value: 'до 10%',
      description: 'Кэшбэк бонусами за покупки',
      footnote: null
    },
    {
      value: '1000',
      description: 'Бонусных баллов за регистрацию в личном кабинете',
      footnote: '*'
    },
    {
      value: 'до 30%',
      description: 'Оплата бонусами стоимости покупки',
      footnote: null
    }
  ]

  useEffect(() => {
    // Анимация появления карточек при загрузке
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardsRef.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) {
              setVisibleCards((prev) => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card)
      })
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    // Автоматическая прокрутка карусели
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % benefitCards.length)
    }, 4000) // Меняем карточку каждые 4 секунды

    return () => clearInterval(interval)
  }, [benefitCards.length])

  async function loadProducts() {
    try {
      setLoading(true)
      
      // Загружаем товары для каталога (6 товаров)
      const { data: catalogData, error: catalogError } = await supabase
        .from('products')
        .select('id, name, price, image_url, images')
        .eq('is_hidden', false)
        .limit(6)
        .order('created_at', { ascending: false })

      if (catalogError) throw catalogError

      // Загружаем товары для корзины (3 товара из featured или популярных)
      const { data: cartData, error: cartError } = await supabase
        .from('products')
        .select('id, name, price, image_url, images')
        .eq('is_hidden', false)
        .eq('is_featured', true)
        .limit(3)
        .order('created_at', { ascending: false })

      if (cartError) throw cartError

      setCatalogProducts(catalogData || [])
      setCartProducts(cartData || [])
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  function calculateTotal() {
    const total = cartProducts.reduce((sum, product) => sum + product.price, 0)
    const bonusAmount = Math.floor(total * 0.3) // 30% бонусов
    const finalAmount = total - bonusAmount
    return { total, bonusAmount, finalAmount }
  }

  const faqItems = [
    {
      question: 'Как накопить бонусы?',
      answer: 'Бонусы начисляются от каждой покупки, в размере 5%, 7% или 10%, в зависимости от уровня программы лояльности. Для рассчёта учитывается только стоимость товаров, без учета услуг, и только после применения прочих акций, скидок или списания бонусов. Начисление бонусов не зависит от способа оформления заказа.'
    },
    {
      question: 'Когда начисляются бонусы?',
      answer: 'Бонусы начисляются автоматически, спустя 15 календарных дней после доставки всех товаров из заказа.'
    },
    {
      question: 'Как потратить бонусы?',
      answer: 'Бонусы можно списать при оформлении заказа, до внесения оплаты / предоплаты. Подтверждение списания осуществляется через смс-код. Списание бонусов возможно при любом способе оформления заказа. Бонусы не действуют на товары с перечёркнутой ценой и на позиции, где итоговая скидка больше 30% от начальной стоимости.'
    },
    {
      question: 'Срок действия бонусов?',
      answer: 'Бонусы действуют в течение 12 месяцев с момента начисления. Отследить текущий баланс, историю начислений и списаний можно в личном кабинете.'
    },
    {
      question: 'Как вступить в программу лояльности?',
      answer: 'Регистрация в программе лояльности происходит автоматически при регистрации профиля в личном кабинете. Определение профиля происходит по номеру телефона. Объединение бонусов или их передача на другой профиль не доступны.'
    },
    {
      question: 'Списание бонусов при возврате товаров?',
      answer: 'Бонусы подлежат списанию с баланса в случае возврата товара.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        {/* Хлебные крошки */}
        <nav className="flex mb-8 md:mb-12" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">Главная</Link></li>
            <li>/</li>
            <li className="text-gray-900">Программа лояльности</li>
          </ol>
        </nav>

        {/* Заголовок */}
        <div className="text-center mb-16 md:mb-20 lg:mb-24">
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
            <img 
              src="/arteco-logo.png" 
              alt="ARTECO Logo" 
              className="h-12 md:h-16 lg:h-20 w-auto object-contain"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight">
              ARTECO CLUB
            </h1>
          </div>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-8 md:mb-10 font-light tracking-wide">
            Чем больше вы покупаете, тем больше экономите!
          </p>
          <Link
            href="/account/orders"
            className="inline-block px-8 md:px-10 lg:px-12 py-3 md:py-4 bg-black text-white font-normal text-xs md:text-sm uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors duration-200 rounded-[50px]"
          >
            Хочу в клуб
          </Link>
        </div>

        {/* Три карточки преимуществ - карусель */}
        <div className="relative mb-16 md:mb-20 lg:mb-24 overflow-hidden">
          <div className="flex items-center justify-center gap-3 md:gap-4 lg:gap-5 px-4 min-h-[350px] md:min-h-[450px] lg:min-h-[500px]">
            {benefitCards.map((card, index) => {
              const isActive = index === activeCardIndex
              const isPrev = index === (activeCardIndex - 1 + benefitCards.length) % benefitCards.length
              const isNext = index === (activeCardIndex + 1) % benefitCards.length
              
              // Определяем позицию карточки
              const position = isActive ? 'center' : (isPrev ? 'left' : isNext ? 'right' : 'side')

              return (
                <div
                  key={index}
                  ref={(el) => { cardsRef.current[index] = el }}
                  className={`bg-white rounded-2xl text-center transition-all duration-700 ease-in-out ${
                    position === 'center' 
                      ? 'scale-100 opacity-100 z-10 p-10 md:p-12 lg:p-14 flex-shrink-0 shadow-xl w-[280px] md:w-[320px] lg:w-[360px]' 
                      : position === 'left' || position === 'right'
                      ? 'scale-[0.75] opacity-80 z-0 p-8 md:p-9 lg:p-10 flex-shrink-0 shadow-md w-[210px] md:w-[240px] lg:w-[270px]'
                      : 'scale-0 opacity-0 hidden'
                  } translate-y-0 h-full flex flex-col justify-center`}
                >
                  <div className={`font-light text-black mb-6 transition-all duration-500 tracking-tight ${
                    position === 'center'
                      ? 'text-5xl md:text-6xl lg:text-7xl'
                      : 'text-3xl md:text-4xl lg:text-5xl'
                  }`}>
                    {card.value}
                  </div>
                  <div className={`text-gray-700 font-light transition-all duration-500 ${
                    position === 'center'
                      ? 'text-sm md:text-base lg:text-lg'
                      : 'text-xs md:text-sm'
                  } ${card.footnote ? 'mb-3' : ''}`}>
                    {card.description}
                  </div>
                  {card.footnote && (
                    <div className={`text-gray-500 transition-all duration-500 mt-2 ${
                      position === 'center' ? 'text-sm' : 'text-xs'
                    }`}>
                      {card.footnote}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Индикаторы */}
          <div className="flex justify-center gap-2 mt-8">
            {benefitCards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveCardIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === activeCardIndex
                    ? 'w-8 h-2 bg-black'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Перейти к карточке ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Секция "Покупайте с удовольствием" */}
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-10 md:p-14 lg:p-16 mb-16 md:mb-20 lg:mb-24 text-white overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Текст */}
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6 md:mb-8 tracking-tight">
                Покупайте с удовольствием
              </h2>
              <p className="text-sm md:text-base lg:text-lg mb-8 md:mb-10 font-light tracking-wide">
                Оплачивайте свои покупки до 30% бонусами
              </p>
              <Link
                href="/catalog"
                className="inline-block px-8 md:px-10 lg:px-12 py-3 md:py-4 bg-white text-black font-normal text-xs md:text-sm uppercase tracking-[0.1em] hover:bg-gray-100 transition-colors duration-200 rounded-[50px]"
              >
                За скидками
              </Link>
            </div>

            {/* Визуализация корзины и интернет-магазина */}
            <div className="relative z-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 md:p-8">
                {/* Визуализация интернет-магазина */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/70 font-light">Интернет-магазин</div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/40"></div>
                      <div className="w-2 h-2 rounded-full bg-white/40"></div>
                      <div className="w-2 h-2 rounded-full bg-white/60"></div>
                    </div>
                  </div>
                  
                  {/* Товары в каталоге */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="aspect-square bg-white/10 rounded-lg border border-white/20 flex items-center justify-center animate-pulse">
                          <div className="w-8 h-8 bg-white/20 rounded"></div>
                        </div>
                      ))
                    ) : catalogProducts.length > 0 ? (
                      catalogProducts.map((product) => {
                        const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : product.image_url
                        return (
                          <div key={product.id} className="aspect-square bg-white/10 rounded-lg border border-white/20 overflow-hidden relative">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 100px"
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-white/20 rounded"></div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="aspect-square bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/20 rounded"></div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Цена товара */}
                  {catalogProducts.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="text-sm font-light text-white/90 truncate">{catalogProducts[0].name}</div>
                      <div className="text-lg font-light text-white ml-2 flex-shrink-0">{formatPrice(catalogProducts[0].price)} ₽</div>
                    </div>
                  )}
                </div>

                {/* Визуализация корзины */}
                <div className="bg-white/10 rounded-xl border border-white/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/70 font-light">Корзина</div>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Товары в корзине */}
                  <div className="space-y-3 mb-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg animate-pulse">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-white/10 rounded flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                              <div className="h-3 bg-white/10 rounded w-3/4 mb-1"></div>
                              <div className="h-2 bg-white/5 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : cartProducts.length > 0 ? (
                      cartProducts.map((product) => {
                        const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : product.image_url
                        return (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-white/10 rounded flex-shrink-0 overflow-hidden relative">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                    unoptimized={true}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white/20 rounded"></div>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-light text-white/90 truncate">{product.name}</div>
                                <div className="text-[10px] text-white/60 font-light">{formatPrice(product.price)} ₽</div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-xs font-light text-white/60 text-center py-2">Корзина пуста</div>
                    )}
                  </div>

                  {/* Итоговая сумма с бонусами */}
                  {cartProducts.length > 0 && (() => {
                    const { total, bonusAmount, finalAmount } = calculateTotal()
                    return (
                      <div className="pt-4 border-t border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-light text-white/70">Сумма заказа</div>
                          <div className="text-sm font-light text-white/90">{formatPrice(total)} ₽</div>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-light text-white/70">Бонусы к списанию</div>
                          <div className="text-sm font-light text-green-300">-{formatPrice(bonusAmount)} ₽</div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/20">
                          <div className="text-sm font-light text-white">К оплате</div>
                          <div className="text-xl font-light text-white">{formatPrice(finalAmount)} ₽</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Уровни программы лояльности */}
        <div className="mb-16 md:mb-20 lg:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-center mb-12 md:mb-16 tracking-tight">
            Уровни программы лояльности
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {/* WHITE */}
            <div
              ref={(el) => { cardsRef.current[3] = el }}
              className={`relative rounded-3xl shadow-2xl transition-all duration-700 ease-out overflow-hidden ${
                visibleCards[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-2 transform`}
              style={{ 
                transitionDelay: '0ms',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)'
              }}
            >
              {/* Текстура карточки */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(0,0,0,0.03) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(0,0,0,0.03) 0%, transparent 50%),
                  linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%)
                `
              }}></div>
              
              <div className="relative p-8 md:p-10 lg:p-12 h-full flex flex-col">
                <div className="mb-auto">
                  <div className="text-2xl md:text-3xl font-light text-black mb-8 tracking-tight">WHITE</div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl md:text-5xl lg:text-6xl font-light text-black tracking-tight">1000</span>
                      <div className="relative mb-1">
                        <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="6" fill="#ff6b35" opacity="0.9"/>
                          <circle cx="12" cy="12" r="6" fill="#ff6b35" opacity="0.7"/>
                          <circle cx="12" cy="16" r="6" fill="#ff6b35" opacity="0.5"/>
                          <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className="text-white text-xs font-bold">Б</text>
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl md:text-5xl lg:text-6xl font-light text-black tracking-tight">5%</div>
                      <div className="text-sm md:text-base text-black font-light mt-1">кэшбэк</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLACK */}
            <div
              ref={(el) => { cardsRef.current[4] = el }}
              className={`relative rounded-3xl shadow-2xl transition-all duration-700 ease-out overflow-hidden ${
                visibleCards[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 transform`}
              style={{ 
                transitionDelay: '150ms',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #1a1a1a 100%)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)'
              }}
            >
              {/* Текстура карточки */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)
                `
              }}></div>
              
              {/* Бейдж POPULAR */}
              <div className="absolute top-4 right-4 bg-white/95 text-black px-3 py-1.5 rounded-full text-xs md:text-sm font-medium z-10 shadow-lg">
                POPULAR
              </div>
              
              <div className="relative p-8 md:p-10 lg:p-12 h-full flex flex-col">
                <div className="mb-auto">
                  <div className="text-2xl md:text-3xl font-light text-white mb-8 tracking-tight">BLACK</div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">1000</span>
                      <div className="relative mb-1">
                        <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="6" fill="#ff6b35" opacity="0.9"/>
                          <circle cx="12" cy="12" r="6" fill="#ff6b35" opacity="0.7"/>
                          <circle cx="12" cy="16" r="6" fill="#ff6b35" opacity="0.5"/>
                          <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className="text-white text-xs font-bold">Б</text>
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">7%</div>
                      <div className="text-sm md:text-base text-white font-light mt-1">кэшбэк</div>
                    </div>
                  </div>
                  <div className="text-center mt-6">
                    <Link
                      href="/account/orders"
                      className="inline-block px-6 py-3 bg-white text-black rounded-full hover:bg-gray-100 transition-colors duration-200 font-normal text-xs md:text-sm uppercase tracking-[0.1em]"
                    >
                      Присоединиться
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* GOLD */}
            <div
              ref={(el) => { cardsRef.current[5] = el }}
              className={`relative rounded-3xl shadow-2xl transition-all duration-700 ease-out overflow-hidden ${
                visibleCards[5] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } hover:shadow-[0_25px_50px_-12px_rgba(212,175,55,0.4)] hover:-translate-y-2 transform`}
              style={{ 
                transitionDelay: '300ms',
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                boxShadow: '0 20px 60px -15px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)'
              }}
            >
              {/* Текстура карточки */}
              <div className="absolute inset-0 opacity-25" style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)
                `
              }}></div>
              
              <div className="relative p-8 md:p-10 lg:p-12 h-full flex flex-col">
                <div className="mb-auto">
                  <div className="text-2xl md:text-3xl font-light text-white mb-8 tracking-tight">GOLD</div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">1000</span>
                      <div className="relative mb-1">
                        <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="6" fill="#ff6b35" opacity="0.9"/>
                          <circle cx="12" cy="12" r="6" fill="#ff6b35" opacity="0.7"/>
                          <circle cx="12" cy="16" r="6" fill="#ff6b35" opacity="0.5"/>
                          <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className="text-white text-xs font-bold">Б</text>
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">10%</div>
                      <div className="text-sm md:text-base text-white font-light mt-1">кэшбэк</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Условия программы */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 lg:p-12 mb-16 md:mb-20 lg:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-8 md:mb-10 tracking-tight">
            Условия накопительной программы лояльности
          </h2>
          
          <p className="text-sm md:text-base text-gray-700 mb-8 md:mb-10 font-light leading-relaxed">
            Чтобы стать участником программы лояльности, достаточно зарегистрироваться на сайте и дать свое согласие на обработку персональных данных.
          </p>

          <div className="space-y-5 md:space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Бонусы зачислятся на ваш бонусный счет через 15 дней после получения заказа.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Баланс и история зачислений/списания доступна в личном кабинете на сайте.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Бонусы начисляются от суммы заказа без учета стоимости услуг.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Бонусы за отмененный заказ аннулируются.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Вы можете потратить бонусы при оплате заказа, оформленного любым способом.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Программа лояльности действует только для физических лиц.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></div>
              <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
                Начислим 1000 бонусов за e-mail и подписку на промо-рассылку. Только для новых участников *
              </p>
            </div>
          </div>

          <div className="mt-10 md:mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/account/orders"
              className="inline-block px-8 md:px-10 lg:px-12 py-3 md:py-4 bg-black text-white font-normal text-xs md:text-sm uppercase tracking-[0.1em] hover:bg-gray-800 transition-colors duration-200 rounded-[50px]"
            >
              Подробные правила программы лояльности
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 lg:p-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-10 md:mb-12 lg:mb-16 text-center tracking-tight">
            Частые вопросы
          </h2>

          <div className="space-y-4 md:space-y-5">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-light text-base md:text-lg">{item.question}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed font-light">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

