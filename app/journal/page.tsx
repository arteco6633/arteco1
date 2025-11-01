'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  author_name: string | null
  author_avatar: string | null
  category: string | null
  tags: string[] | null
  views_count: number
  is_featured?: boolean
  published_at: string | null
  created_at: string
}

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadArticles()
  }, [selectedCategory])

  async function loadArticles() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('journal_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Ошибка Supabase при загрузке статей:', error)
        setArticles([])
        setFeaturedArticles([])
        setCategories([])
        return
      }

      // Разделяем на featured и обычные
      const featured = (data || []).filter((a: Article) => a.is_featured).slice(0, 3)
      const regular = (data || []).filter((a: Article) => !a.is_featured)

      setFeaturedArticles(featured)
      setArticles(regular)

      // Получаем уникальные категории
      const cats = Array.from(new Set((data || []).map((a: Article) => a.category).filter(Boolean))) as string[]
      setCategories(cats)
    } catch (error: any) {
      console.error('Ошибка загрузки статей:', error?.message || error)
      setArticles([])
      setFeaturedArticles([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-12">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-xl">Загрузка...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8 md:py-12">
        {/* Заголовок */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Журнал</h1>
          <p className="text-gray-600 text-lg">Статьи о дизайне, трендах и вдохновении</p>
        </div>

        {/* Категории */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === null
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-gray-300 hover:border-black'
              }`}
            >
              Все статьи
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-300 hover:border-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Featured статьи */}
        {featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Рекомендуемые статьи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/journal/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {article.featured_image && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {article.category && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-black/80 text-white text-xs font-semibold rounded-full">
                          {article.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-black/80 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {article.author_name && (
                        <div className="flex items-center gap-2">
                          {article.author_avatar && (
                            <img
                              src={article.author_avatar}
                              alt={article.author_name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{article.author_name}</span>
                        </div>
                      )}
                      {article.published_at && (
                        <>
                          <span>•</span>
                          <span>{formatDate(article.published_at)}</span>
                        </>
                      )}
                      {article.views_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{article.views_count} просмотров</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Остальные статьи */}
        {articles.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              {selectedCategory ? `Статьи в категории "${selectedCategory}"` : 'Все статьи'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/journal/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {article.featured_image && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {article.category && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-black/80 text-white text-xs font-semibold rounded-full">
                          {article.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-black/80 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {article.author_name && (
                        <div className="flex items-center gap-2">
                          {article.author_avatar && (
                            <img
                              src={article.author_avatar}
                              alt={article.author_name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{article.author_name}</span>
                        </div>
                      )}
                      {article.published_at && (
                        <>
                          <span>•</span>
                          <span>{formatDate(article.published_at)}</span>
                        </>
                      )}
                      {article.views_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{article.views_count} просмотров</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold mb-2">Статей пока нет</h2>
            <p className="text-gray-600">В журнале пока нет опубликованных статей</p>
          </div>
        )}
      </main>
    </div>
  )
}

