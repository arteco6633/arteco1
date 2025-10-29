'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HeroBanners from '@/components/HeroBanners'
import ProductGrid from '@/components/ProductGrid'
import Categories from '@/components/Categories'

// helper: наблюдение за видимостью элемента
function useInView(ref: React.RefObject<HTMLElement>, rootMargin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setInView(entry.isIntersecting))
      },
      { root: null, rootMargin, threshold: 0.2 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, rootMargin])
  return inView
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number
  is_featured: boolean
  is_new: boolean
}

interface Banner {
  id: number
  title: string
  description: string
  image_url: string
  link_url: string
  button_text: string
  position: string
  is_active: boolean
  sort_order: number
}

interface Category {
  id: number
  name: string
  slug: string
  is_active: boolean
  image_url: string | null
}

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // ref для первого баннера (стрелка появления при скролле)
  const firstBannerRef = useState<HTMLElement | null>(null)[0] as any
  const firstBannerInView = useInView({ current: firstBannerRef } as any, '0px')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Загружаем баннеры
      const { data: bannersData } = await supabase
        .from('promo_blocks')
        .select('*')
        .eq('is_active', 'true')
        .order('position', { ascending: true })

      // Загружаем featured товары
      const { data: featuredData } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', 'true')
        .limit(8)

      // Загружаем новые товары - пока без фильтра
      const { data: newData } = await supabase
        .from('products')
        .select('*')
        .limit(8)

      // Загружаем категории
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      setBanners(bannersData || [])
      setFeaturedProducts(featuredData || [])
      setNewProducts(newData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  // Группируем баннеры по позициям
  const topBanner = banners.filter(b => b.position === 'top' && b.is_active).sort((a, b) => a.sort_order - b.sort_order)[0]
  const middleBanners = banners.filter(b => b.position === 'middle' && b.is_active).sort((a, b) => a.sort_order - b.sort_order).slice(0, 2)
  const bottomBanner = banners.filter(b => b.position === 'bottom' && b.is_active).sort((a, b) => a.sort_order - b.sort_order)[0]
  // Дополнительные промо-блоки перед «Новинки»
  // 1) Пытаемся взять по позициям `middle2` и `bottom2`
  // 2) Фолбэк: берём следующие элементы из существующих позиций
  const middle2ByPosition = banners
    .filter(b => b.position === 'middle2' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 2)
  const middleFallback = banners
    .filter(b => b.position === 'middle' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(2, 4)
  const middleBanners2 = (middle2ByPosition.length > 0 ? middle2ByPosition : middleFallback)

  const bottom2ByPosition = banners
    .filter(b => b.position === 'bottom2' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
  const bottoms = banners
    .filter(b => b.position === 'bottom' && b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
  // Статичный баннер для блока перед "Новинки": берём любую позицию, кроме top и bottom (которые уже использованы)
  // Попробуем взять из middle после первых двух, или из любого другого источника
  const availableBanners = banners
    .filter(b => b.is_active && b.position !== 'top' && b.position !== 'bottom')
    .sort((a, b) => a.sort_order - b.sort_order)
  const bottomBanner2 = bottom2ByPosition[0] || availableBanners[0]

  return (
    <div className="min-h-screen overflow-x-hidden max-w-full">
      <Navbar />
      <main className="overflow-x-hidden contain-inline">
        {/* Первый блок: Один большой банер слева + кнопка справа */}
        {topBanner && (
          <section className="py-2 clip-x">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-10 gap-4 max-w-full">
                {/* Большой банер - 7 колонок (70%) */}
                <div ref={firstBannerRef} className={`relative h-[440px] sm:h-[520px] md:h-[600px] col-span-10 md:col-span-7 overflow-hidden rounded-[15px] group reveal-on-scroll ${firstBannerInView ? 'in-view' : ''} max-w-full`}>
                  <img
                    src={topBanner.image_url}
                    alt={topBanner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-12">
                    <h3 className="text-white text-2xl sm:text-3xl font-bold mb-3">
                      {topBanner.title}
                    </h3>
                    {topBanner.description && (
                      <p className="text-white/90 text-sm sm:text-base mb-6">
                        {topBanner.description}
                      </p>
                    )}
                    {topBanner.link_url && (
                      <div className="group">
                        <a
                          href={topBanner.link_url}
                          className="inline-flex items-center text-white font-semibold text-base sm:text-lg group-hover:translate-x-4 transition-all duration-300 cursor-pointer"
                        >
                          <span className="scroll-arrow opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 mr-2 text-2xl">→</span>
                          <span>{topBanner.button_text || 'Перейти'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопка каталога - 3 колонки (30%) */}
                <a
                  href="/catalog"
                  className="h-[340px] sm:h-[420px] md:h-[600px] col-span-10 md:col-span-3 flex flex-col justify-between text-black hover:opacity-90 transition-opacity py-8 px-8 md:px-12 rounded-[15px] max-w-full contain-inline"
                  style={{ backgroundColor: '#F7A8C2' }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 md:gap-4 group">
                      <h2 className="text-2xl sm:text-2xl md:text-2xl font-semibold leading-tight tracking-tight group-hover:translate-x-2 transition-all duration-300">
                         За покупками
                       </h2>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-14 md:h-14 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-xl md:text-xl">→</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>Магазин: ARTECO.ru</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Второй блок: Два промо-баннера */}
        {middleBanners.length > 0 && (
          <section className="py-2 clip-x">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {middleBanners.map((banner) => (
                  <div key={banner.id} className="relative h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden rounded-[15px] group max-w-full">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
                      <h3 className="text-white text-2xl sm:text-3xl font-bold mb-3">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-white/90 text-sm sm:text-base mb-5">
                          {banner.description}
                        </p>
                      )}
                      <div className="group">
                        <a
                          href={banner.link_url || '/'}
                          className="inline-flex items-center text-white font-semibold text-base sm:text-lg transition-all duration-300 cursor-pointer"
                        >
                          <span className="w-0 overflow-hidden opacity-0 group-hover:w-6 group-hover:opacity-100 transition-[width,opacity,transform] duration-300 -translate-x-2 group-hover:translate-x-0 mr-0 group-hover:mr-2 text-3xl">→</span>
                          <span>{banner.button_text || 'Подробнее'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Третий блок: Статический промо-баннер с анимацией */}
        {bottomBanner && (
          <section className="py-2 clip-x">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <a
                href={bottomBanner.link_url || '/catalog'}
                className="block w-full h-[600px] md:h-[700px] relative overflow-hidden rounded-[15px] group cursor-pointer max-w-full contain-inline"
                style={{ 
                  background: '#B2F542',
                }}
              >
                {/* Черные сердечки (анимация из центра вверх) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[15px] max-w-full">
                  <div className="absolute bottom-1/3 left-[38%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-60 group-hover:translate-x-6" style={{ transitionDelay: '0ms' }}>
                    <span className="text-5xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[38%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-64 group-hover:-translate-x-10" style={{ transitionDelay: '200ms' }}>
                    <span className="text-4xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[50%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-72 group-hover:translate-x-3" style={{ transitionDelay: '400ms' }}>
                    <span className="text-6xl text-black">♡</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[50%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-56 group-hover:-translate-x-5" style={{ transitionDelay: '300ms' }}>
                    <span className="text-3xl text-black">♥</span>
                  </div>
                  
                  {/* Дополнительные черные сердечки */}
                  <div className="absolute bottom-1/3 left-[35%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-54 group-hover:translate-x-8" style={{ transitionDelay: '100ms' }}>
                    <span className="text-4xl text-black">♡</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[35%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-62 group-hover:-translate-x-12" style={{ transitionDelay: '500ms' }}>
                    <span className="text-5xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[52%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-48 group-hover:translate-x-2" style={{ transitionDelay: '600ms' }}>
                    <span className="text-3xl text-black">♥</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[52%] max-w-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-50 group-hover:-translate-x-3" style={{ transitionDelay: '150ms' }}>
                    <span className="text-4xl text-black">♥</span>
                  </div>
                </div>

                {/* Контент */}
                <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
                  {/* Главный заголовок - по центру */}
                  <div className="text-center animate-[slideUp_1.5s_ease-out]">
                    <h3 className="text-black text-4xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight">
                      The ARTECO kitchen<br />
                      <span className="block mt-4">
                        match<wbr />maker
                      </span>
                    </h3>
                  </div>
                  
                  {/* Текст и кнопка - внизу слева */}
                  <div className="absolute bottom-8 sm:bottom-10 left-6 sm:left-8 flex flex-col items-start gap-1 group-hover:translate-x-4 transition-all duration-300 animate-[slideUpBottom_1.8s_ease-out_0.5s_both]">
                    <p className="text-black text-sm mb-1">
                      Откройте для себя кухню своей мечты
                    </p>
                    
                    {/* Кнопка с анимацией стрелки */}
                    <div className="flex items-center">
                      <span className="w-0 overflow-hidden opacity-0 group-hover:w-6 group-hover:opacity-100 transition-[width,opacity,transform] duration-300 -translate-x-2 group-hover:translate-x-0 text-3xl text-black mr-0 group-hover:mr-2">→</span>
                      <span className="text-black font-semibold text-2xl">
                        Пройди тест!
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </section>
        )}

        <Categories categories={categories} />

        {/* Дополнительные два промо-баннера (динамичные) */}
        {middleBanners2.length > 0 && (
          <section className="pt-12 pb-2 clip-x">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {middleBanners2.map((banner) => (
                  <div key={banner.id} className="relative h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden rounded-[15px] group max-w-full">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end px-6 pb-6 sm:px-8 sm:pb-8">
                      <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-white/90 text-sm sm:text-base mb-4">
                          {banner.description}
                        </p>
                      )}
                      <div className="group">
                        <a
                          href={banner.link_url || '/'}
                          className="inline-flex items-center text-white font-semibold text-base sm:text-lg group-hover:translate-x-4 transition-all duration-300 cursor-pointer"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">→</span>
                          <span>{banner.button_text || 'Подробнее'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Один статичный промо-баннер (ниже) */}
        {bottomBanner2 && (
          <section className="py-2 clip-x">
            <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 max-w-full">
              <a
                href={bottomBanner2.link_url || '/catalog'}
                className="block w-full h-[600px] md:h-[700px] relative overflow-hidden rounded-[15px] group cursor-pointer max-w-full contain-inline"
                style={{ 
                  background: '#FFA94D',
                }}
              >
                {/* Черные шарики (анимация из центра вверх) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[15px] max-w-full">
                  <div className="absolute bottom-1/3 left-1/3 sm:left-[38%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-60 group-hover:translate-x-6" style={{ transitionDelay: '0ms' }}>
                    <span className="text-5xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 sm:right-[38%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-64 group-hover:-translate-x-10" style={{ transitionDelay: '200ms' }}>
                    <span className="text-4xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 left-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-72 group-hover:translate-x-3" style={{ transitionDelay: '400ms' }}>
                    <span className="text-6xl text-black">○</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-56 group-hover:-translate-x-5" style={{ transitionDelay: '300ms' }}>
                    <span className="text-3xl text-black">●</span>
                  </div>
                  
                  {/* Дополнительные черные шарики */}
                  <div className="absolute bottom-1/3 left-1/3 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-54 group-hover:translate-x-8" style={{ transitionDelay: '100ms' }}>
                    <span className="text-4xl text-black">○</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-62 group-hover:-translate-x-12" style={{ transitionDelay: '500ms' }}>
                    <span className="text-5xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 left-[52%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-48 group-hover:translate-x-2" style={{ transitionDelay: '600ms' }}>
                    <span className="text-3xl text-black">●</span>
                  </div>
                  <div className="absolute bottom-1/3 right-[52%] opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:-translate-y-50 group-hover:-translate-x-3" style={{ transitionDelay: '150ms' }}>
                    <span className="text-4xl text-black">●</span>
                  </div>
                </div>

                {/* Контент */}
                <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
                  {/* Главный заголовок - по центру */}
                  <div className="opacity-0 sm:opacity-100 sm:group-hover:opacity-100 sm:group-hover:animate-[slideInFromLeft_0.8s_ease-out] transition-opacity duration-300">
                    <h3 className="text-black text-4xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight">
                      Замер за 1₽
                    </h3>
                  </div>
                  
                  {/* Текст и кнопка - внизу слева */}
                  <div className="absolute bottom-8 sm:bottom-10 left-6 sm:left-8 flex flex-col items-start gap-1 group-hover:translate-x-4 transition-all duration-300 animate-[slideUpBottom_1.8s_ease-out_0.5s_both]">
                    <p className="text-black text-sm mb-1">
                      Выиграйте консультацию дизайнера у вас дома
                    </p>
                    
                    {/* Кнопка с анимацией стрелки */}
                    <div className="flex items-center">
                      <span className="w-0 overflow-hidden opacity-0 group-hover:w-6 group-hover:opacity-100 transition-[width,opacity,transform] duration-300 -translate-x-2 group-hover:translate-x-0 text-3xl text-black mr-0 group-hover:mr-2">→</span>
                      <span className="text-black font-semibold text-2xl">
                        Играть
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </section>
        )}

        {/* Новинки */}
        {newProducts.length > 0 && (
          <section className="py-8 bg-white">
            <div className="max-w-[1400px] 2xl:max-w-none mx-auto px-4 md:px-3 xl:px-6 2xl:px-9">
              <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                <div className="order-2 md:order-1 flex-1">
                  <ProductGrid products={newProducts} onlyFirstTwo />
                </div>
                <div className="order-1 md:order-2 w-full md:w-[420px] lg:w-[480px]">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Каталог новинок</h2>
                  <p className="text-gray-600 text-base mb-4">
                    ARTECO – интернет-магазин по-настоящему удобной мебели. Мы предлагаем своим покупателям современную мебель собственного производства и готовы гарантировать не только высокое качество изделий, но и доступную цену. А наши регулярные акции и специальные предложения приятно удивят!
                  </p>
                  <div>
                    <a href="/catalog" className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-2">
                      Посмотреть всё →
                    </a>
                  </div>
                </div>
              </div>
              {/* Остальные товары во всю ширину */}
              {newProducts.length > 2 && (
                <div className="mt-6">
                  <ProductGrid products={newProducts.slice(2)} />
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12 overflow-x-hidden w-full max-w-full clip-x">
        <div className="w-full max-w-[1400px] 2xl:max-w-none mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 overflow-x-hidden">
          <div className="text-center">
            <p className="break-words">&copy; 2025 ARTECO. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

