'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Category {
  id: number
  name: string
  slug: string
  image_url?: string | null
}

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hideOnScroll, setHideOnScroll] = useState(false)
  const [hasShadow, setHasShadow] = useState(false)
  // Иконка-логотип: по умолчанию крестик (true), при появлении хэдера превращается в гамбургер (false)
  const [isCross, setIsCross] = useState(true)
  // Умный поиск
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{id:number; name:string; price:number; image_url:string}>>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  // Показ хедера при скролле вверх и скрытие при скролле вниз
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      const scrollingDown = currentY > lastY
      const nearTop = currentY < 4
      // Скрываем при прокрутке вниз после порога, иначе показываем
      if (scrollingDown && currentY > 80) {
        setHideOnScroll(true)
        setIsCross(true)
      } else {
        setHideOnScroll(false)
        setIsCross(false)
      }
      setHasShadow(!nearTop)
      lastY = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Debounce поиск
  useEffect(() => {
    if (!searchOpen) return
    const q = searchQuery.trim()
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .ilike('name', `%${q}%`)
          .limit(8)
        setSearchResults(data || [])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, searchOpen])

  // Закрытие по клику вне
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchRef.current) return
      if (!searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      setCategories(data || [])
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  return (
    <>
    <header className={`bg-white fixed top-0 left-0 right-0 z-50 transition-transform duration-600 ease-in-out will-change-transform ${hideOnScroll ? '-translate-y-full' : 'translate-y-0'} ${hasShadow ? 'border-b shadow-sm' : 'border-b border-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-3" ref={searchRef}>
        <div className="flex items-center justify-between h-20">
          {/* Логотип */}
          <Link href="/" className="flex items-center gap-1 text-2xl font-bold text-black select-none">
            <span>ART</span>
            {/* Буква E стилизована как гамбургер-иконка с морфом X ↔︎ ≡ при появлении хэдера */}
            <span aria-hidden className="relative w-5 h-4 mx-0.5">
              <span
                className={`absolute left-0 right-0 h-[2px] bg-black rounded origin-center transition-all duration-1000 ease-in-out ${isCross ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0 rotate-0'}`}
              />
              <span
                className={`absolute left-0 right-0 h-[2px] bg-black rounded origin-center transition-all duration-1000 ease-in-out ${isCross ? 'opacity-0' : 'top-1/2 -translate-y-1/2 opacity-100'}`}
              />
              <span
                className={`absolute left-0 right-0 h-[2px] bg-black rounded origin-center transition-all duration-1000 ease-in-out ${isCross ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0 rotate-0'}`}
              />
            </span>
            <span>CO</span>
          </Link>

          {/* Мобильный поиск (иконка) и бургер */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              aria-label="Поиск"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen((v) => !v)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              aria-label="Открыть меню"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileOpen((v) => !v)}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Навигационные ссылки */}
          <div className="hidden xl:flex items-center gap-6">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Каталог</span>
            </button>

            {/* Удалена ссылка "Все категории" по запросу */}

            <a href="#promotions" className="text-black hover:text-gray-600 transition-colors">
              Акции
            </a>
            <a href="#journal" className="text-black hover:text-gray-600 transition-colors">
              Журнал
            </a>
            <a href="#showrooms" className="text-black hover:text-gray-600 transition-colors">
              Шоурумы
            </a>
          </div>

          {/* Поисковая строка (десктоп) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Поиск по товарам..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* Выпадающие результаты */}
              {searchOpen && (
                <div className="absolute z-50 mt-2 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-[70vh] overflow-auto">
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Ищем...</div>
                  )}
                  {!searchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="px-4 py-3 text-sm text-gray-500">Ничего не найдено</div>
                  )}
                  {!searchLoading && searchResults.map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50" onClick={() => setSearchOpen(false)}>
                      <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1">
                        <div className="text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.price?.toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </Link>
                  ))}
                  {searchResults.length > 0 && (
                    <Link href={`/catalog`} className="block text-center text-sm text-blue-600 hover:text-blue-800 px-4 py-3 border-t" onClick={() => setSearchOpen(false)}>
                      Посмотреть все результаты
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Иконки */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" id="cartCount">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Выпадающее меню категорий */}
        {isMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-[1880px] mx-auto px-6 md:px-8 py-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/catalog/${category.slug}`}
                    className="w-full p-5 border border-gray-200 rounded-2xl hover:border-gray-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    <div className="font-semibold text-base leading-snug line-clamp-2 w-full">{category.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Мобильное выпадающее меню */}
        {isMobileOpen && (
          <div className="xl:hidden absolute top-20 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-[1400px] mx-auto px-3 py-4 space-y-4">
              {/* Мобильный поиск */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                  placeholder="Поиск по товарам..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {/* Результаты поиска (мобайл) */}
                {searchOpen && (
                  <div className="absolute z-50 mt-2 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-[60vh] overflow-auto">
                    {searchLoading && (
                      <div className="px-4 py-3 text-sm text-gray-500">Ищем...</div>
                    )}
                    {!searchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                      <div className="px-4 py-3 text-sm text-gray-500">Ничего не найдено</div>
                    )}
                    {!searchLoading && searchResults.map((p) => (
                      <Link key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50" onClick={() => { setIsMobileOpen(false); setSearchOpen(false) }}>
                        <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-12 h-12 rounded object-cover" />
                        <div className="flex-1">
                          <div className="text-sm line-clamp-1">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.price?.toLocaleString('ru-RU')} ₽</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Быстрые ссылки */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/catalog" className="px-4 py-2 border rounded-lg text-center" onClick={() => setIsMobileOpen(false)}>Каталог</Link>
                <a href="#promotions" className="px-4 py-2 border rounded-lg text-center" onClick={() => setIsMobileOpen(false)}>Акции</a>
                <a href="#journal" className="px-4 py-2 border rounded-lg text-center" onClick={() => setIsMobileOpen(false)}>Журнал</a>
                <a href="#showrooms" className="px-4 py-2 border rounded-lg text-center" onClick={() => setIsMobileOpen(false)}>Шоурумы</a>
              </div>

              {/* Категории списком */}
              {categories.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Категории</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/catalog/${category.slug}`}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <div className="text-sm font-medium">{category.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    {/* Спейсер, чтобы контент не прыгал при fixed-хедере */}
    <div className="h-20" />
    </>
  )
}

