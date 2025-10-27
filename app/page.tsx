'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HeroBanners from '@/components/HeroBanners'
import ProductGrid from '@/components/ProductGrid'
import Categories from '@/components/Categories'

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

export default function HomePage() {
  const [banners, setBanners] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Загружаем баннеры
      const { data: bannersData } = await supabase
        .from('promo_blocks')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })

      // Загружаем featured товары
      const { data: featuredData } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(8)

      // Загружаем новые товары
      const { data: newData } = await supabase
        .from('products')
        .select('*')
        .eq('is_new', true)
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Первый блок: Один большой банер слева + кнопка справа */}
        {topBanner && (
          <section className="py-2">
            <div className="max-w-[1400px] mx-auto px-3">
              <div className="grid grid-cols-10 gap-4">
                {/* Большой банер - 7 колонок (70%) */}
                <div className="relative h-[500px] md:h-[600px] col-span-10 md:col-span-7 overflow-hidden rounded-[25px] group">
                  <img
                    src={topBanner.image_url}
                    alt={topBanner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12">
                    <h3 className="text-white text-4xl font-bold mb-3">
                      {topBanner.title}
                    </h3>
                    {topBanner.description && (
                      <p className="text-white/90 text-xl mb-6">
                        {topBanner.description}
                      </p>
                    )}
                    {topBanner.link_url && (
                      <div className="group">
                        <a
                          href={topBanner.link_url}
                          className="inline-flex items-center text-white font-semibold text-xl group-hover:translate-x-4 transition-all duration-300 cursor-pointer"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">→</span>
                          <span>{topBanner.button_text || 'Перейти'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопка каталога - 3 колонки (30%) */}
                <a
                  href="/catalog"
                  className="h-[500px] md:h-[600px] col-span-10 md:col-span-3 flex flex-col justify-between text-black hover:opacity-90 transition-opacity py-8 px-8 md:px-12 rounded-[25px]"
                  style={{ backgroundColor: '#F7A8C2' }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 md:gap-4 group">
                      <h2 className="text-xl md:text-3xl font-bold leading-tight group-hover:translate-x-2 transition-all duration-300">
                        За покупками
                      </h2>
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-lg md:text-xl">→</span>
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
          <section className="py-2">
            <div className="max-w-[1400px] mx-auto px-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {middleBanners.map((banner) => (
                  <div key={banner.id} className="relative h-[400px] md:h-[500px] overflow-hidden rounded-[25px] group">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <h3 className="text-white text-3xl font-bold mb-3">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-white/90 text-lg mb-5">
                          {banner.description}
                        </p>
                      )}
                      {banner.link_url && (
                        <div className="group">
                          <a
                            href={banner.link_url}
                            className="inline-flex items-center text-white font-semibold text-lg group-hover:translate-x-4 transition-all duration-300 cursor-pointer"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">→</span>
                            <span>{banner.button_text || 'Перейти'}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Новинки */}
        {newProducts.length > 0 && (
          <section className="py-2">
            <div className="max-w-[1400px] mx-auto px-3">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Новинки
              </h2>
              <ProductGrid products={newProducts} />
            </div>
          </section>
        )}

        {/* Третий блок: Еще один большой банер */}
        {bottomBanner && (
          <section className="py-2">
            <div className="max-w-[1400px] mx-auto px-3">
              <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-[25px] group">
                <img
                  src={bottomBanner.image_url}
                  alt={bottomBanner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-16">
                  <h3 className="text-white text-5xl font-bold mb-5">
                    {bottomBanner.title}
                  </h3>
                  {bottomBanner.description && (
                    <p className="text-white/90 text-2xl mb-8">
                      {bottomBanner.description}
                    </p>
                  )}
                  {bottomBanner.link_url && (
                    <div className="group">
                      <a
                        href={bottomBanner.link_url}
                        className="inline-flex items-center text-white font-bold text-2xl group-hover:translate-x-4 transition-all duration-300 cursor-pointer"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-3 text-3xl">→</span>
                        <span>{bottomBanner.button_text || 'Перейти'}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Рекомендуемые товары */}
        {featuredProducts.length > 0 && (
          <section className="py-2 bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-3">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Рекомендуемые товары
              </h2>
              <ProductGrid products={featuredProducts} />
            </div>
          </section>
        )}

        <Categories categories={categories} />
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-3">
          <div className="text-center">
            <p>&copy; 2025 ARTECO. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

