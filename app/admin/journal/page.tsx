'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Журнал - Статьи</h1>
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
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            + Добавить статью
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заголовок</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{article.category || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {article.is_published && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Опубликовано</span>
                      )}
                      {article.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Рекомендуемое</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.published_at || article.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(article)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Модальное окно */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingArticle ? 'Редактировать статью' : 'Добавить статью'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Заголовок *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">URL (slug) *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Краткое описание</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Контент (Markdown) *</label>
                    
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
                      className="w-full border rounded-b-lg rounded-t-none px-3 py-2 font-mono text-sm"
                      rows={15}
                      placeholder="Начните писать... Используйте панель инструментов выше для форматирования"
                    />
                    <p className="text-xs text-gray-500 mt-1">Поддерживается Markdown разметка. Используйте кнопки выше для форматирования</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Главное изображение</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    {formData.featured_image && (
                      <img src={formData.featured_image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Имя автора</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Аватар автора</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAuthorAvatarUpload}
                      disabled={uploading}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    {formData.author_avatar && (
                      <img src={formData.author_avatar} alt="Author" className="mt-2 w-16 h-16 rounded-full object-cover" />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Категория</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Например: Дизайн, Тренды, Инспирация"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="тег1, тег2, тег3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Вам может понравится (товары)</label>
                    {loadingProducts ? (
                      <div className="text-sm text-gray-500">Загрузка товаров...</div>
                    ) : (
                      <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                        {products.length === 0 ? (
                          <div className="text-sm text-gray-500">Нет доступных товаров</div>
                        ) : (
                          <div className="space-y-2">
                            {products.map((product) => (
                              <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                  {product.image_url && (
                                    <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{product.name}</div>
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
                      <div className="text-xs text-gray-500 mt-1">Выбрано товаров: {selectedProducts.length}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Дата публикации</label>
                    <input
                      type="date"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      />
                      <span>Опубликовано</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      />
                      <span>Рекомендуемое</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    {editingArticle ? 'Обновить' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

