'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { withQueryTimeout } from '@/lib/supabase-query'
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
  const [loading, setLoading] = useState(false) // НЕ блокируем показ страницы
  // Тумблер на корне каталога показываем как info, ведёт на первую категорию

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const { data, error } = await withQueryTimeout(
        supabase
          .from('categories')
          .select('id, name, slug, description, image_url, is_active')
          .eq('is_active', true)
          .order('position', { ascending: true, nullsFirst: false })
          .order('name', { ascending: true })
      )
      
      if (error) {
        console.error('Ошибка загрузки категорий:', error)
      }
      
      if (data) {
        console.log('Загружено категорий:', data.length)
        // Логируем URL изображений для отладки
        data.forEach(cat => {
          if (cat.image_url) {
            console.log(`Категория "${cat.name}":`, cat.image_url)
          }
        })
      }
      
        setCategories((data || []) as Category[])
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }

  // Показываем страницу сразу, даже если данные еще загружаются
  // На медленном интернете это критично
  if (false) { // Отключено - не блокируем показ страницы
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col items-center text-center p-0"
            >
              <div className="w-full aspect-[4/3] min-h-[200px] md:min-h-[240px] overflow-hidden bg-gray-100 relative rounded-2xl rounded-b-none">
                {category.image_url ? (
                  <>
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (min-width: 1024px) 33vw, 33vw"
                      className="object-cover"
                      quality={90}
                      unoptimized={category.image_url?.startsWith('http')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.parentElement) {
                          const fallback = target.parentElement.querySelector('.image-fallback') as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }
                      }}
                    />
                    <div className="image-fallback absolute inset-0 w-full h-full flex items-center justify-center text-4xl bg-gray-100" style={{ display: 'none' }}>
                      📦
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
              </div>
              <div className="w-full px-3 pb-4 pt-3 md:px-5 md:pb-5 md:pt-4 text-left">
                <h3 className="text-[15px] sm:text-base md:text-lg font-semibold leading-snug mb-1 group-hover:text-black transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-500 text-xs sm:text-sm leading-snug line-clamp-2">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

