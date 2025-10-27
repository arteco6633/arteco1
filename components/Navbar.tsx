'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Category {
  id: number
  name: string
  slug: string
}

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      setCategories(data || [])
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-3">
        <div className="flex items-center justify-between h-20">
          {/* Логотип */}
          <Link href="/" className="text-2xl font-bold text-black">
            ARTECO
          </Link>

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

            <Link
              href="/catalog"
              className="text-black hover:text-gray-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Все категории
            </Link>

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

          {/* Поисковая строка */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Мягкая кровать"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
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
        <div className="absolute top-16 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-[1400px] mx-auto px-3 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog/${category.slug}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="text-xl mb-2">📦</div>
                  <div className="font-semibold">{category.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

