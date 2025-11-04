'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url?: string | null
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  // Тумблер на корне каталога показываем как info, ведёт на первую категорию

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      setCategories(data || [])
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1680px] 2xl:max-w-none px-4 md:px-2 xl:px-4 2xl:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Каталог товаров</h1>

        {/* Сетка категорий (на мобилках строго 2 в ряд) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col items-center text-center p-4 md:p-5"
            >
              <div className="w-full aspect-square max-w-none md:max-w-[140px] rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                {category.image_url ? (
                  <Image src={category.image_url} alt={category.name} fill sizes="(min-width: 1024px) 140px, 33vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 group-hover:text-black transition-colors text-center">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 text-center text-sm leading-snug line-clamp-2">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

