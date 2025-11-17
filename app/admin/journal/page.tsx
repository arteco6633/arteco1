'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  og_image?: string | null
  author_name: string | null
  author_avatar: string | null
  category: string | null
  tags: string[] | null
  related_products: number[] | null
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  created_at: string
}

interface Product {
  id: number
  name: string
  image_url: string
  price: number
}

export default function AdminJournalPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    og_image: '',
    author_name: '',
    author_avatar: '',
    category: '',
    tags: '',
    is_published: false,
    is_featured: false,
    published_at: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingContentImage, setUploadingContentImage] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const contentImageInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadArticles()
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, price')
        .order('name', { ascending: true })

      if (error) {
        console.error('Ошибка загрузки товаров:', error)
        return
      }
      setProducts(data || [])
    } catch (error: any) {
      console.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadArticles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('journal_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Ошибка Supabase при загрузке статей:', error)
        alert(`Ошибка загрузки статей: ${error.message}`)
        setArticles([])
        return
      }
      setArticles(data || [])
    } catch (error: any) {
      console.error('Ошибка загрузки статей:', error)
      alert(`Ошибка загрузки статей: ${error?.message || 'Неизвестная ошибка'}`)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function handleTitleChange(title: string) {
    setFormData({ ...formData, title, slug: generateSlug(title) })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `journal/${fileName}`

      const { error } = await supabase.storage
        .from('product')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      setFormData({ ...formData, featured_image: data.publicUrl })
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки изображения')
    } finally {
      setUploading(false)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  async function handleAuthorAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `author-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `journal/${fileName}`

      const { error } = await supabase.storage
        .from('product')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      setFormData({ ...formData, author_avatar: data.publicUrl })
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки изображения')
    } finally {
      setUploading(false)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  async function handleOgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `og-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `journal/${fileName}`

      const { error } = await supabase.storage
        .from('product')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      setFormData({ ...formData, og_image: data.publicUrl })
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки изображения')
    } finally {
      setUploading(false)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  // Функция для вставки текста в textarea в позицию курсора
  function insertTextAtCursor(text: string) {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const before = value.substring(0, start)
    const after = value.substring(end, value.length)
    const newValue = before + text + after

    setFormData({ ...formData, content: newValue })

    // Устанавливаем курсор после вставленного текста
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Функции форматирования
  function applyFormatting(format: string) {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '****'
        break
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '**'
        break
      case 'h1':
        formattedText = `# ${selectedText || 'Заголовок 1'}`
        break
      case 'h2':
        formattedText = `## ${selectedText || 'Заголовок 2'}`
        break
      case 'h3':
        formattedText = `### ${selectedText || 'Заголовок 3'}`
        break
      case 'ul':
        formattedText = selectedText 
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : '- '
        break
      case 'ol':
        formattedText = selectedText 
          ? selectedText.split('\n').map((line, idx) => `${idx + 1}. ${line}`).join('\n')
          : '1. '
        break
      case 'link':
        formattedText = selectedText ? `[${selectedText}](url)` : '[текст ссылки](url)'
        break
      default:
        return
    }

    const value = textarea.value
    const before = value.substring(0, start)
    const after = value.substring(end, value.length)
    const newValue = before + formattedText + after

    setFormData({ ...formData, content: newValue })

    // Устанавливаем курсор после вставленного текста
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = selectedText 
        ? start + formattedText.length
        : format === 'bold' ? start + 2 
        : format === 'italic' ? start + 1
        : start + formattedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Загрузка изображения в контент
  async function handleContentImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingContentImage(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `content-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `journal/${fileName}`

      const { error } = await supabase.storage
        .from('product')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      const imageMarkdown = `![Описание изображения](${data.publicUrl})\n`
      insertTextAtCursor(imageMarkdown)
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки изображения')
    } finally {
      setUploadingContentImage(false)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const articleData: any = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        featured_image: formData.featured_image || null,
        og_image: formData.og_image || null,
        author_name: formData.author_name || null,
        author_avatar: formData.author_avatar || null,
        category: formData.category || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        related_products: selectedProducts.length > 0 ? selectedProducts : null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published ? (formData.published_at || new Date().toISOString()) : null,
      }

      if (editingArticle) {
        const { error } = await supabase
          .from('journal_articles')
          .update(articleData)
          .eq('id', editingArticle.id)

        if (error) {
          console.error('Ошибка Supabase при обновлении:', error)
          throw new Error(`Ошибка обновления статьи: ${error.message}`)
        }
      } else {
        const { error } = await supabase
          .from('journal_articles')
          .insert([articleData])

        if (error) {
          console.error('Ошибка Supabase при создании:', error)
          throw new Error(`Ошибка создания статьи: ${error.message}`)
        }
      }

      setShowModal(false)
      setEditingArticle(null)
      setSelectedProducts([])
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        og_image: '',
        author_name: '',
        author_avatar: '',
        category: '',
        tags: '',
        is_published: false,
        is_featured: false,
        published_at: '',
      })
      loadArticles()
    } catch (error: any) {
      console.error('Ошибка сохранения статьи:', error)
      alert(error?.message || 'Ошибка сохранения статьи. Проверьте консоль для деталей.')
    }
  }

  function handleEdit(article: Article) {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content,
      featured_image: article.featured_image || '',
      og_image: (article as any).og_image || '',
      author_name: article.author_name || '',
      author_avatar: article.author_avatar || '',
      category: article.category || '',
      tags: article.tags?.join(', ') || '',
      is_published: article.is_published,
      is_featured: article.is_featured,
      published_at: article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : '',
    })
    setSelectedProducts(article.related_products || [])
    setShowModal(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить статью?')) return

    try {
      const { error } = await supabase
        .from('journal_articles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Ошибка Supabase при удалении:', error)
        throw new Error(`Ошибка удаления статьи: ${error.message}`)
      }
      loadArticles()
    } catch (error: any) {
      console.error('Ошибка удаления статьи:', error)
      alert(error?.message || 'Ошибка удаления статьи. Проверьте консоль для деталей.')
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Иконки
  const Icons = {
    ArrowLeft: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    Plus: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    Edit: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    Trash: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    Close: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    Check: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    X: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  }

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Хедер */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Icons.ArrowLeft />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Журнал - Статьи</h1>
            </div>
            <button
              onClick={() => {
                setEditingArticle(null)
                setSelectedProducts([])
                setFormData({
                  title: '',
                  slug: '',
                  excerpt: '',
                  content: '',
                  featured_image: '',
                  og_image: '',
                  author_name: '',
                  author_avatar: '',
                  category: '',
                  tags: '',
                  is_published: false,
                  is_featured: false,
                  published_at: '',
                })
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Icons.Plus />
              <span>Добавить статью</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Всего статей</div>
            <div className="text-3xl font-bold text-gray-900">{articles.length}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Опубликовано</div>
            <div className="text-3xl font-bold text-green-600">
              {articles.filter(a => a.is_published).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Рекомендуемые</div>
            <div className="text-3xl font-bold text-yellow-600">
              {articles.filter(a => a.is_featured).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Черновики</div>
            <div className="text-3xl font-bold text-gray-600">
              {articles.filter(a => !a.is_published).length}
            </div>
          </div>
        </div>

        {/* Таблица статей */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Список статей</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск статей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">ID</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[300px]">Статья</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Категория</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">Статус</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Дата</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-500">#{article.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {article.featured_image && (
                          <div className="flex-shrink-0">
                            <img
                              src={article.featured_image}
                              alt={article.title}
                              className="w-20 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{article.title}</div>
                          {article.excerpt && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{article.excerpt}</div>
                          )}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {article.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {tag}
                                </span>
                              ))}
                              {article.tags.length > 3 && (
                                <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{article.category || <span className="text-gray-400">—</span>}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {article.is_published && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Icons.Check />
                            Опубликовано
                          </span>
                        )}
                        {article.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Icons.Check />
                            Рекомендуемое
                          </span>
                        )}
                        {!article.is_published && !article.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Icons.X />
                            Черновик
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
                          title="Редактировать статью"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
                          title="Удалить статью"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg font-medium">
                {searchQuery ? 'Статьи не найдены' : articles.length === 0 ? 'Статьи отсутствуют' : 'Нет результатов поиска'}
              </p>
              {!searchQuery && articles.length === 0 && (
                <button
                  onClick={() => {
                    setEditingArticle(null)
                    setSelectedProducts([])
                    setFormData({
                      title: '',
                      slug: '',
                      excerpt: '',
                      content: '',
                      featured_image: '',
                      og_image: '',
                      author_name: '',
                      author_avatar: '',
                      category: '',
                      tags: '',
                      is_published: false,
                      is_featured: false,
                      published_at: '',
                    })
                    setShowModal(true)
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Icons.Plus />
                  <span>Добавить первую статью</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Хедер модального окна */}
          <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingArticle ? 'Редактировать статью' : 'Добавить статью'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>
          </div>

          {/* Контент модального окна */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Основная информация */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Основная информация
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Заголовок <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Введите заголовок статьи"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL (slug) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                      placeholder="url-stati"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL-адрес статьи. Генерируется автоматически из заголовка
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Краткое описание
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={3}
                      placeholder="Краткое описание статьи для превью (необязательно)"
                    />
                  </div>
                </div>
              </div>

              {/* Контент статьи */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Контент статьи
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Контент (Markdown) <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Панель инструментов */}
                  <div className="border border-b-0 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-2">
                      {/* Кнопки форматирования текста */}
                      <button
                        type="button"
                        onClick={() => applyFormatting('bold')}
                        className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
                        title="Жирный (Ctrl+B)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4v8a4 4 0 01-4 4H6a4 4 0 01-4-4V8a4 4 0 014-4z" />
                        </svg>
                        <span className="font-bold">B</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => applyFormatting('italic')}
                        className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
                        title="Курсив (Ctrl+I)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16M4 12h16M4 20h16" />
                        </svg>
                        <span className="italic">I</span>
                      </button>

                      {/* Заголовки */}
                      <div className="border-l border-gray-300 pl-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => applyFormatting('h1')}
                          className="px-2 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                          title="Заголовок 1"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('h2')}
                          className="px-2 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                          title="Заголовок 2"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('h3')}
                          className="px-2 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                          title="Заголовок 3"
                        >
                          H3
                        </button>
                      </div>

                      {/* Списки */}
                      <div className="border-l border-gray-300 pl-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => applyFormatting('ul')}
                          className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                          title="Маркированный список"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('ol')}
                          className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                          title="Нумерованный список"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>

                      {/* Ссылка */}
                      <button
                        type="button"
                        onClick={() => applyFormatting('link')}
                        className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors"
                        title="Добавить ссылку"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>

                      {/* Загрузка изображения */}
                      <div className="border-l border-gray-300 pl-2">
                        <input
                          ref={contentImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleContentImageUpload}
                          disabled={uploadingContentImage}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => contentImageInputRef.current?.click()}
                          disabled={uploadingContentImage}
                          className="px-3 py-1.5 border rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Добавить изображение"
                        >
                          {uploadingContentImage ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Загрузка...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Фото</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  <textarea
                    ref={contentTextareaRef}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border rounded-b-lg rounded-t-none px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={20}
                    placeholder="Начните писать... Используйте панель инструментов выше для форматирования"
                  />
                  <p className="text-xs text-gray-500 mt-2">Поддерживается Markdown разметка. Используйте кнопки выше для форматирования</p>
                </div>
              </div>

              {/* Изображения */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Изображения
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Главное изображение</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {uploading ? 'Загрузка…' : 'Выбрать файл'}
                        </span>
                      </label>
                    </div>
                    {formData.featured_image && (
                      <div className="mt-4">
                        <img src={formData.featured_image} alt="Preview" className="max-w-full h-auto max-h-64 object-contain rounded-lg border-2 border-gray-200" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">OG‑изображение (для предпросмотра ссылок)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOgImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {uploading ? 'Загрузка…' : 'Выбрать файл'}
                        </span>
                      </label>
                    </div>
                    {formData.og_image && (
                      <div className="mt-4">
                        <img src={formData.og_image} alt="OG Preview" className="max-w-full h-auto max-h-64 object-contain rounded-lg border-2 border-gray-200" />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Рекомендуется 1200×630px</p>
                  </div>
                </div>
              </div>

              {/* Автор и метаданные */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Автор и метаданные
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя автора</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Имя автора"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Аватар автора</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAuthorAvatarUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {uploading ? 'Загрузка…' : 'Выбрать файл'}
                        </span>
                      </label>
                      {formData.author_avatar && (
                        <img src={formData.author_avatar} alt="Author" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Например: Дизайн, Тренды, Инспирация"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="тег1, тег2, тег3"
                    />
                  </div>
                </div>
              </div>

              {/* Связанные товары */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Связанные товары
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Вам может понравится (товары)</label>
                  {loadingProducts ? (
                    <div className="text-sm text-gray-500 py-4">Загрузка товаров...</div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                      {products.length === 0 ? (
                        <div className="text-sm text-gray-500 py-4 text-center">Нет доступных товаров</div>
                      ) : (
                        <div className="space-y-2">
                          {products.map((product) => (
                            <label key={product.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts([...selectedProducts, product.id])
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-3 flex-1">
                                {product.image_url && (
                                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded border border-gray-200" />
                                )}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="text-xs text-gray-500">{product.price.toLocaleString('ru-RU')} ₽</div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedProducts.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">Выбрано товаров: {selectedProducts.length}</div>
                  )}
                </div>
              </div>

              {/* Настройки публикации */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Настройки публикации
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата публикации</label>
                    <input
                      type="date"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="is_published"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      />
                      <label htmlFor="is_published" className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Опубликовано</span>
                        {formData.is_published && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Icons.Check />
                            Активно
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="is_featured"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      />
                      <label htmlFor="is_featured" className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Рекомендуемое</span>
                        {formData.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Icons.Check />
                            Активно
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Панель действий */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingArticle ? 'Обновить статью' : 'Создать статью'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

