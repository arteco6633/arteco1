'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useSession, signOut } from 'next-auth/react'
import AuthModal from '@/components/AuthModal'
import { useCart } from '@/components/CartContext'
import { useWishlist } from '@/components/WishlistContext'
import dynamic from 'next/dynamic'

interface Category {
  id: number
  name: string
  slug: string
  image_url?: string | null
}

export default function Navbar() {
  const { count, setOpen } = useCart()
  const { count: wishlistCount } = useWishlist()
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
  const searchOverlayRef = useRef<HTMLDivElement>(null)
  // Подавление первого клика снаружи после программного открытия поиска
  const suppressOutsideCloseRef = useRef(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    loadCategories()
  }, [])

  // Глобальные события от нижнего мобильного меню
  useEffect(() => {
    const openAuthHandler = () => setAuthOpen(true)
    const openSearchHandler = () => { setIsMobileOpen(false); suppressOutsideCloseRef.current = true; setSearchOpen(true) }
    const toggleSearchHandler = () => {
      setIsMobileOpen(false)
      suppressOutsideCloseRef.current = true
      setSearchOpen((v) => !v)
    }
    window.addEventListener('open-auth', openAuthHandler as any)
    window.addEventListener('open-search', openSearchHandler as any)
    window.addEventListener('arteco:open-search', openSearchHandler as any)
    window.addEventListener('arteco:toggle-search', toggleSearchHandler as any)
    return () => {
      window.removeEventListener('open-auth', openAuthHandler as any)
      window.removeEventListener('open-search', openSearchHandler as any)
      window.removeEventListener('arteco:open-search', openSearchHandler as any)
      window.removeEventListener('arteco:toggle-search', toggleSearchHandler as any)
    }
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
          .eq('is_hidden', false) // Исключаем скрытые товары из поиска
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
      if (suppressOutsideCloseRef.current) { suppressOutsideCloseRef.current = false; return }
      const target = e.target as Node
      if (!target) return
      const insideHeader = searchRef.current?.contains(target)
      const insideOverlay = searchOverlayRef.current?.contains(target)
      if (insideHeader || insideOverlay) return
      setSearchOpen(false)
    }
    document.addEventListener('click', onDoc, true)
    return () => document.removeEventListener('click', onDoc, true)
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
    <header className={`bg-white fixed top-0 left-0 right-0 z-[60] transition-transform duration-600 ease-in-out will-change-transform ${hideOnScroll ? '-translate-y-full' : 'translate-y-0'} ${hasShadow ? 'border-b shadow-sm' : 'border-b border-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-3" ref={searchRef}>
        <div className="relative h-20 flex items-center justify-between">
          {/* Лого: абсолютный центр на мобайле, обычный поток на десктопе */}
          <div className="absolute left-1/2 -translate-x-1/2 xl:static xl:translate-x-0">
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
          </div>

          {/* Мобильный бургер (поиск перенесён в нижнее меню) - слева */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              aria-label="Открыть меню"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative z-[70]"
              onClick={(e) => { e.stopPropagation(); setIsMobileOpen((v) => !v) }}
            >
              <span aria-hidden className="relative block w-7 h-5">
                <span
                  className={`absolute left-0 right-0 top-0 h-[2px] bg-black rounded transition-all duration-500 ease-in-out ${isMobileOpen ? 'translate-y-2.5 rotate-45' : 'translate-y-0 rotate-0'}`}
                />
                <span
                  className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-black rounded transition-all duration-500 ease-in-out ${isMobileOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] bg-black rounded transition-all duration-500 ease-in-out ${isMobileOpen ? '-translate-y-2.5 -rotate-45' : 'translate-y-0 rotate-0'}`}
                />
              </span>
            </button>
          </div>

          {/* Навигационные ссылки */}
          <div className="hidden xl:flex items-center gap-6">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Каталог</span>
            </button>

            {/* Удалена ссылка "Все категории" по запросу */}

            <Link href="/partners" className="text-black hover:text-gray-600 transition-colors">
              Партнерам
            </Link>
            <Link href="/journal" className="text-black hover:text-gray-600 transition-colors">
              Журнал
            </Link>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-[50px] focus:outline-none focus:border-gray-400"
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

          {/* Иконки справа */}
          <div className="flex items-center gap-4 relative">
            {/* Вход/профиль скрыт на мобайле */}
            <button
              className="hidden md:inline-flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                if (session) {
                  setProfileMenuOpen((v) => !v)
                } else {
                  setAuthOpen(true)
                }
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {profileMenuOpen && session && (
              <div className="absolute right-0 top-12 w-48 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 text-sm border-b">{(session as any).phone || 'Профиль'}</div>
                <a href="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50">Мои заказы</a>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setProfileMenuOpen(false); signOut({ redirect: false }) }}
                >
                  Выйти
                </button>
              </div>
            )}
            <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" onClick={() => setOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" id="cartCount">
                {count}
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

        {/* Мобильное выпадающее меню (оверлей) */}
        {isMobileOpen && (
          <div className="xl:hidden fixed inset-0 z-50">
            {/* затемнение: блюрим всё КРОМЕ хэдера */}
            <div className="absolute left-0 right-0 bottom-0 top-20 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            {/* панель */}
            <div className="absolute top-0 left-0 right-0 mt-20">{/* ниже хэдера */}
              <div className="mx-auto max-w-[1680px] 2xl:max-w-[1880px] px-1 md:px-2 xl:px-4 2xl:px-6">
                <div className="bg-white rounded-b-2xl shadow-xl p-4 pb-6 border">
                  {/* Быстрые ссылки */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/catalog" className="px-4 py-3 rounded-[50px] border bg-white hover:bg-gray-50 text-center font-medium" onClick={() => setIsMobileOpen(false)}>Каталог</Link>
                    <Link href="/partners" className="px-4 py-3 rounded-[50px] border bg-white hover:bg-gray-50 text-center font-medium" onClick={() => setIsMobileOpen(false)}>Партнерам</Link>
                    <Link href="/journal" className="px-4 py-3 rounded-[50px] border bg-white hover:bg-gray-50 text-center font-medium" onClick={() => setIsMobileOpen(false)}>Журнал</Link>
                    <a href="#showrooms" className="px-4 py-3 rounded-[50px] border bg-white hover:bg-gray-50 text-center font-medium" onClick={() => setIsMobileOpen(false)}>Шоурумы</a>
                  </div>

                  {/* Категории */}
                  {categories.length > 0 && (
                    <div className="mt-5">
                      <div className="text-sm text-gray-500 mb-3">Категории</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/catalog/${category.slug}`}
                            className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-gray-50"
                            onClick={() => setIsMobileOpen(false)}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                              ) : null}
                            </div>
                            <div className="text-sm font-medium line-clamp-2">{category.name}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
    {/* Мобильный оверлей поиска - вне хэдера, чтобы не влиял translateY скрывающегося хэдера */}
    {searchOpen && (
      <div className="lg:hidden fixed bottom-28 left-0 right-0 z-[60] px-3">
        <div className="max-w-[1400px] mx-auto" ref={searchOverlayRef}>
          <div className="flex justify-end mb-2 pr-1">
            <button
              aria-label="Закрыть поиск"
              className="w-8 h-8 rounded-full bg-white/90 shadow grid place-items-center text-gray-600 hover:bg-white"
              onClick={() => setSearchOpen(false)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              autoFocus
              placeholder="Поиск по товарам..."
              className="w-full bg-white px-4 pr-4 py-3 border border-gray-300 rounded-[50px] shadow-md focus:outline-none focus:border-gray-400"
            />
            
            <div className="mt-3 max-h-[60vh] overflow-auto bg-white rounded-xl shadow-md">
              {searchLoading && (
                <div className="px-2 py-3 text-sm text-gray-500">Ищем...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="px-2 py-3 text-sm text-gray-500">Ничего не найдено</div>
              )}
              {!searchLoading && searchResults.map((p, idx) => (
                <Link key={p.id} href={`/product/${p.id}`} className={`flex items-center gap-3 px-3 py-3 hover:bg-gray-50 ${idx !== searchResults.length - 1 ? 'border-b border-gray-100' : ''}`} onClick={() => setSearchOpen(false)}>
                  <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <div className="text-sm line-clamp-1">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.price?.toLocaleString('ru-RU')} ₽</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Спейсер, чтобы контент не прыгал при fixed-хедере */}
    <div className="h-20" />
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

