'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

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
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="mx-auto max-w-[1680px] px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
        <h1 className="text-4xl font-bold mb-8">Каталог товаров</h1>

        {/* Сетка категорий */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-xl transition-all group flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-gray-100 mb-3">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
              </div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors text-center">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 text-center">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 ARTECO. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}

