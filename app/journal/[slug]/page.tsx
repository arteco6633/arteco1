'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { withQueryTimeout } from '@/lib/supabase-query'
import Link from 'next/link'
import Head from 'next/head'
import ProductGrid from '@/components/ProductGrid'
import DOMPurify from 'isomorphic-dompurify'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_name: string | null
  author_avatar: string | null
  category: string | null
  tags: string[] | null
  related_products: number[] | null
  views_count: number
  published_at: string | null
  created_at: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number
  image_url: string
  images?: string[] | null
  category_id: number
  is_new?: boolean
  is_featured?: boolean
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false) // НЕ блокируем показ страницы
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  useEffect(() => {
    if (slug) {
      loadArticle()
    }
  }, [slug])

  async function loadArticle() {
    try {
      setLoading(true)

      // Декодируем slug из URL (может быть закодирован)
      const decodedSlug = decodeURIComponent(slug || '')
      
      console.log('Загрузка статьи со slug:', decodedSlug)
      
      // Загружаем статью - сначала без фильтра по is_published, чтобы понять, существует ли она
      const { data: articleData, error } = await withQueryTimeout<Article>(
        supabase
          .from('journal_articles')
          .select('*')
          .eq('slug', decodedSlug)
          .single()
      )
      
      console.log('Результат запроса:', { articleData, error })

      if (error) {
        // Если статья не найдена (PGRST116), это нормальная ситуация, не логируем как ошибку
        const isNotFound = error.code === 'PGRST116' || 
                           error.code === '42P01' || // relation does not exist (таблица не существует)
                           (typeof error.message === 'string' && (
                             error.message.includes('No rows returned') ||
                             error.message.includes('0 rows') ||
                             error.message.includes('relation') && error.message.includes('does not exist')
                           )) ||
                           (typeof error.hint === 'string' && error.hint.includes('0 rows'))

        if (isNotFound) {
          // Статья не найдена - это нормально, просто показываем страницу "не найдено"
          setArticle(null)
          setLoading(false)
          return
        }
        
        // Только реальные ошибки с полезной информацией логируем
        // Не логируем пустые объекты ошибок
        if (error.code || (typeof error.message === 'string' && error.message.length > 0)) {
          console.error('Ошибка Supabase при загрузке статьи:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
        }
        
        setArticle(null)
        setLoading(false)
        return
      }

      if (!articleData) {
        console.warn(`Статья со slug "${decodedSlug}" не найдена в базе данных`)
        
        // Попробуем найти все статьи с похожим slug для диагностики
        const { data: allArticles } = await withQueryTimeout<Article[]>(
          supabase
            .from('journal_articles')
            .select('slug, is_published, title')
            .limit(10),
          5000 // Короткий таймаут для диагностики
        )
        console.log('Все статьи в базе (первые 10):', allArticles)
        
        setArticle(null)
        setLoading(false)
        return
      }

      if (!articleData) {
        setArticle(null)
        setLoading(false)
        return
      }

      const article = articleData as Article & { is_published?: boolean; views_count?: number }

      console.log('Статья найдена:', {
        id: article.id,
        title: article.title,
        slug: article.slug,
        is_published: article.is_published
      })

      // Проверяем, опубликована ли статья
      if (!article.is_published) {
        console.warn(`Статья со slug "${decodedSlug}" существует, но не опубликована (is_published = false)`)
        setArticle(null)
        setLoading(false)
        return
      }

      console.log('Статья успешно загружена и опубликована')
      setArticle(article)
      
      // Сразу снимаем флаг загрузки, чтобы показать статью
      setLoading(false)

      // Увеличиваем счетчик просмотров (не блокируем если ошибка) - делаем асинхронно
      try {
        await supabase
          .from('journal_articles')
          .update({ views_count: (article.views_count || 0) + 1 })
          .eq('id', article.id)
      } catch (viewsError) {
        console.warn('Ошибка обновления счетчика просмотров:', viewsError)
        // Не критично, продолжаем
      }

      // Загружаем связанные товары, если они есть
      if (article.related_products && article.related_products.length > 0) {
        try {
          const { data: productsData, error: productsError } = await withQueryTimeout<Array<{ id: number; name: string; price: number; original_price?: number | null; image_url: string; images?: string[] | null; description?: string | null }>>(
            supabase
              .from('products')
              .select('id, name, price, original_price, image_url, images, description')
              .in('id', article.related_products)
          )

          if (!productsError && productsData) {
            // Преобразуем данные, чтобы соответствовать интерфейсу Product
            const formattedProducts = productsData.map(p => ({
              ...p,
              description: p.description || '',
              original_price: p.original_price || undefined
            }))
            setRelatedProducts(formattedProducts as Product[])
          }
          } catch (productsError) {
            console.warn('Ошибка загрузки связанных товаров:', productsError)
            setRelatedProducts([])
          }
        }

      // Загружаем похожие статьи - делаем асинхронно
      try {
        let related = null
        if (article.category) {
          const { data } = await withQueryTimeout<Array<{ id: number; title: string; slug: string; excerpt?: string | null; featured_image?: string | null; published_at?: string | null; category?: string | null }>>(
            supabase
              .from('journal_articles')
              .select('id, title, slug, excerpt, featured_image, published_at, category')
              .eq('is_published', true)
              .neq('id', article.id)
              .eq('category', article.category)
              .limit(3)
              .order('published_at', { ascending: false })
          )
          related = data
        }

        if (related && related.length > 0) {
          setRelatedArticles(related as Article[])
        } else {
          // Если нет статей в той же категории, загружаем любые
          const { data: anyRelated } = await withQueryTimeout<Array<{ id: number; title: string; slug: string; excerpt?: string | null; featured_image?: string | null; published_at?: string | null; category?: string | null }>>(
            supabase
              .from('journal_articles')
              .select('id, title, slug, excerpt, featured_image, published_at, category')
              .eq('is_published', true)
              .neq('id', article.id)
              .limit(3)
              .order('published_at', { ascending: false })
          )

            setRelatedArticles((anyRelated || []) as Article[])
          }
        } catch (relatedError) {
          console.warn('Ошибка загрузки похожих статей:', relatedError)
          setRelatedArticles([])
        }
    } catch (error: any) {
      // Логируем только если это не ошибка "статья не найдена"
      if (error?.code !== 'PGRST116' && 
          !error?.message?.includes('No rows') &&
          !error?.message?.includes('0 rows')) {
        console.error('Критическая ошибка загрузки статьи:', error?.message || error)
      }
      setArticle(null)
      setLoading(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Простой парсер markdown (базовый)
  function parseMarkdown(content: string) {
    if (!content) return ''
    
    let html = content
    
    // Код блоки
    html = html.replace(/```([^`]+)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
    
    // Инлайн код
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
    
    // Изображения (обрабатываем ПЕРЕД ссылками, так как синтаксис похож)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-6" />')
    
    // Заголовки
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-6">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-12 mb-8">$1</h1>')
    
    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    
    // Курсив
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
    
    // Ссылки
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
    
    // Списки (нужно обработать до параграфов)
    const lines = html.split('\n')
    let inList = false
    let result: string[] = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.match(/^[\*\-] /)) {
        if (!inList) {
          result.push('<ul class="list-disc list-inside mb-4 space-y-2">')
          inList = true
        }
        const listItem = trimmed.replace(/^[\*\-] /, '')
        result.push(`<li class="ml-4">${listItem}</li>`)
      } else {
        if (inList) {
          result.push('</ul>')
          inList = false
        }
        // Пропускаем теги изображений, заголовков, списков и кода - они уже обработаны
        if (trimmed && !trimmed.match(/^<[h|ul|ol|pre|img]/i)) {
          result.push(`<p class="mb-4 leading-relaxed">${trimmed}</p>`)
        } else if (trimmed) {
          result.push(trimmed)
        }
      }
    })
    
    if (inList) {
      result.push('</ul>')
    }
    
    return result.join('\n')
  }

  // Показываем страницу сразу, даже если данные еще загружаются
  // На медленном интернете это критично
  if (false) { // Отключено - не блокируем показ страницы
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

  if (!article) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-12">
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-semibold mb-2">Статья не найдена</h2>
            <p className="text-gray-600 mb-6">Такой статьи не существует или она не опубликована</p>
            <Link href="/journal" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-colors">
              Вернуться в журнал
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{article.title}</title>
        <meta name="description" content={article.excerpt || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || ''} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arteeeco.ru'}/journal/${article.slug}`} />
        <meta property="og:image" content={(article as any).og_image || article.featured_image || '/favicon-1024x1024.png'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt || ''} />
        <meta name="twitter:image" content={(article as any).og_image || article.featured_image || '/favicon-1024x1024.png'} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arteeeco.ru'}/journal/${article.slug}`} />
      </Head>
      <main className="max-w-[1400px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8 md:py-12">
        {/* Хлебные крошки */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">Главная</Link></li>
            <li>/</li>
            <li><Link href="/journal" className="hover:text-gray-700">Журнал</Link></li>
            {article.category && (
              <>
                <li>/</li>
                <li className="text-gray-900">{article.category}</li>
              </>
            )}
          </ol>
        </nav>

        <article className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Изображение */}
          {article.featured_image && (
            <div className="relative w-full aspect-[21/9] overflow-hidden bg-gray-100">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* Заголовок */}
            <div className="mb-8">
              {article.category && (
                <span className="inline-block px-4 py-2 bg-black text-white text-sm font-semibold rounded-full mb-4">
                  {article.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{article.title}</h1>
              
              {/* Мета информация */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                {article.author_name && (
                  <div className="flex items-center gap-2">
                    {article.author_avatar && (
                      <img
                        src={article.author_avatar}
                        alt={article.author_name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">{article.author_name}</span>
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

              {/* Теги */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Контент */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(parseMarkdown(article.content), {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'pre', 'code', 'blockquote'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
                  ALLOW_DATA_ATTR: false
                })
              }}
            />
          </div>
        </article>

        {/* Секция "Вам может понравится" */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Вам может понравится</h2>
            <ProductGrid products={relatedProducts} horizontal />
          </section>
        )}

        {/* Похожие статьи */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-bold mb-8">Похожие статьи</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/journal/${related.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {related.featured_image && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={related.featured_image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-black/80 transition-colors">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2">{related.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

