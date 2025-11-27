'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
// Navbar удалён для админ-панели

interface PromoBlock {
  id: number
  title: string
  description: string | null
  image_url: string
  video_url: string | null
  link_url: string | null
  button_text: string | null
  position: string
  is_active: boolean
  sort_order: number
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<PromoBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PromoBlock | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    link_url: '',
    button_text: '',
    position: 'homepage',
    is_active: true,
    sort_order: '0',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data } = await supabase
        .from('promo_blocks')
        .select('*')
        .order('sort_order', { ascending: true })
      
      setBanners(data || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingBanner(null)
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      link_url: '',
      button_text: '',
      position: 'homepage',
      is_active: true,
      sort_order: '0',
    })
    setShowModal(true)
  }

  function openEditModal(banner: PromoBlock) {
    setEditingBanner(banner)
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      video_url: banner.video_url || '',
      link_url: banner.link_url || '',
      button_text: banner.button_text || '',
      position: banner.position,
      is_active: banner.is_active,
      sort_order: banner.sort_order.toString(),
    })
    setShowModal(true)
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Функция для удаления файла из Supabase Storage
  async function deleteFileFromStorage(url: string): Promise<void> {
    if (!url) return
    
    try {
      // Извлекаем путь к файлу из URL
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/product\/(.+)/)
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1]
        const { error } = await supabase.storage
          .from('product')
          .remove([filePath])
        
        if (error) {
          console.warn('Не удалось удалить файл из Storage:', filePath, error)
        } else {
          console.log('✓ Старый файл удален:', filePath)
        }
      }
    } catch (error) {
      console.warn('Ошибка при удалении файла:', error)
    }
  }

  async function uploadVideo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `banners/videos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage
      .from('product')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем размер файла (ограничение до 200 МБ)
    const maxSize = 200 * 1024 * 1024 // 200 МБ
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимальный размер видео: 200 МБ')
      if (videoInputRef.current) videoInputRef.current.value = ''
      return
    }

    try {
      setUploadingVideo(true)
      const url = await uploadVideo(file)
      setFormData((prev) => ({ ...prev, video_url: url }))
      console.log('Видео успешно загружено:', url)
    } catch (error: any) {
      console.error('Ошибка загрузки видео:', error)
      let errorMessage = 'Ошибка загрузки видео'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error) {
        errorMessage = JSON.stringify(error)
      }
      
      alert(`Ошибка загрузки видео:\n${errorMessage}`)
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    
    try {
      let imageUrl = formData.image_url
      // Сохраняем старый URL для удаления после загрузки нового
      const oldImageUrl = editingBanner?.image_url

      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile)
        
        // Удаляем старое изображение, если оно было заменено
        if (oldImageUrl && oldImageUrl !== imageUrl) {
          await deleteFileFromStorage(oldImageUrl)
        }
      }

      // Формируем данные для сохранения, исключая video_url, если оно пустое
      const bannerData: any = {
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        link_url: formData.link_url || null,
        button_text: formData.button_text || null,
        position: formData.position,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order),
      }

      // Добавляем video_url только если оно есть (если поле существует в таблице)
      if (formData.video_url && formData.video_url.trim()) {
        bannerData.video_url = formData.video_url.trim()
      }

      let error: any = null

      if (editingBanner) {
        const result = await supabase
          .from('promo_blocks')
          .update(bannerData)
          .eq('id', editingBanner.id)

        error = result.error
      } else {
        const result = await supabase
          .from('promo_blocks')
          .insert(bannerData)

        error = result.error
      }

      // Если ошибка связана с video_url (поле отсутствует в таблице), пробуем сохранить без него
      if (error && bannerData.video_url) {
        const errorMessage = error.message || error.toString() || ''
        if (errorMessage.includes('video_url') || errorMessage.includes('column') || error.code === 'PGRST116') {
          console.warn('Поле video_url отсутствует в таблице promo_blocks, сохраняем без него')
          delete bannerData.video_url
          
          if (editingBanner) {
            const retryResult = await supabase
              .from('promo_blocks')
              .update(bannerData)
              .eq('id', editingBanner.id)
            error = retryResult.error
          } else {
            const retryResult = await supabase
              .from('promo_blocks')
              .insert(bannerData)
            error = retryResult.error
          }
          
          if (!error) {
            alert('Внимание: Баннер сохранён, но поле video_url отсутствует в базе данных. Пожалуйста, обратитесь к администратору для добавления этого поля в таблицу promo_blocks.')
          }
        }
      }

      if (error) {
        console.error('Ошибка сохранения баннера:', error)
        throw new Error(error.message || `Ошибка сохранения: ${JSON.stringify(error)}`)
      }

      setShowModal(false)
      setSelectedImageFile(null)
      setImagePreview('')
      setFormData((prev) => ({ ...prev, video_url: '' }))
      loadData()
    } catch (error: any) {
      console.error('Ошибка сохранения:', error)
      let errorMessage = 'Неизвестная ошибка при сохранении баннера'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error) {
        errorMessage = JSON.stringify(error)
      }
      
      // Проверяем, связана ли ошибка с video_url
      if (errorMessage.includes('video_url') || errorMessage.includes('column') || errorMessage.includes('PGRST116')) {
        errorMessage += '\n\nВозможно, поле video_url отсутствует в таблице promo_blocks.\nВыполните SQL скрипт setup_promo_blocks_video.sql для добавления этого поля.'
      }
      
      alert(`Ошибка при сохранении баннера:\n${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить этот баннер?')) return

    try {
      const { error } = await supabase
        .from('promo_blocks')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка при удалении баннера')
    }
  }

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

  // Иконки
  const Icons = {
    ArrowLeft: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
  }

  const filteredBanners = banners.filter((banner) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      banner.title.toLowerCase().includes(query) ||
      banner.description?.toLowerCase().includes(query) ||
      banner.position.toLowerCase().includes(query)
    )
  })

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
              <h1 className="text-2xl font-bold text-gray-900">Управление баннерами</h1>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Icons.Plus />
              <span>Добавить баннер</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Всего баннеров</div>
            <div className="text-3xl font-bold text-gray-900">{banners.length}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Активных</div>
            <div className="text-3xl font-bold text-green-600">
              {banners.filter(b => b.is_active).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">На главной</div>
            <div className="text-3xl font-bold text-blue-600">
              {banners.filter(b => b.position === 'homepage').length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С кнопкой</div>
            <div className="text-3xl font-bold text-purple-600">
              {banners.filter(b => b.button_text).length}
            </div>
          </div>
        </div>

        {/* Таблица баннеров */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Список баннеров</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск баннеров..."
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
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Баннер</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Позиция</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Порядок</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Статус</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-64">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-500">#{banner.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-20 h-14 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{banner.title}</div>
                          {banner.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{banner.description}</div>
                          )}
                          {banner.link_url && (
                            <div className="text-xs text-blue-600 truncate mt-1">
                              <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {banner.link_url}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {banner.position === 'homepage' ? 'Главная' : 
                         banner.position === 'top' ? 'Верх' :
                         banner.position === 'middle' ? 'Середина' :
                         banner.position === 'bottom' ? 'Низ' : banner.position}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">{banner.sort_order}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          banner.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {banner.is_active ? (
                          <>
                            <Icons.Check />
                            Активен
                          </>
                        ) : (
                          <>
                            <Icons.X />
                            Неактивен
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(banner)}
                          className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
                          title="Редактировать баннер"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
                          title="Удалить баннер"
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
        </div>

        {filteredBanners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">
              {searchQuery ? 'Баннеры не найдены' : 'Баннеры отсутствуют'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Icons.Plus />
                <span>Добавить первый баннер</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Хедер модального окна */}
          <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBanner ? 'Редактировать баннер' : 'Добавить баннер'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading}
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
                      Название <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Введите название баннера"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Введите описание баннера (необязательно)"
                    />
                  </div>
                </div>
              </div>

              {/* Изображение баннера */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Изображение баннера
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Загрузить изображение
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <span className="text-sm font-medium text-gray-700">Выбрать файл</span>
                      </label>
                      {selectedImageFile && (
                        <span className="text-sm text-gray-600">{selectedImageFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Или введите URL изображения
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {(imagePreview || formData.image_url) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Превью изображения
                      </label>
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Превью баннера"
                          className="max-w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Видео баннера (опционально) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Видео баннера (опционально)
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Загрузить видео
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          className="hidden"
                          onChange={handleVideoSelect}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {uploadingVideo ? 'Загрузка...' : 'Выбрать видео'}
                        </span>
                      </label>
                      {uploadingVideo && (
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Или введите URL видео
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Если указано видео, оно будет автоматически воспроизводиться вместо изображения
                    </p>
                  </div>

                  {formData.video_url && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Превью видео
                      </label>
                      <div className="relative inline-block max-w-full">
                        <video
                          src={formData.video_url}
                          controls
                          className="max-w-full h-auto max-h-96 rounded-lg border-2 border-gray-200"
                          preload="metadata"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ссылки и действия */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Ссылки и действия
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ссылка (URL)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL, на который будет вести баннер при клике
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текст кнопки
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="Перейти в каталог"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Текст кнопки на баннере (если требуется)
                    </p>
                  </div>
                </div>
              </div>

              {/* Настройки отображения */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Настройки отображения
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Позиция <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                    >
                      <option value="homepage">Главная страница</option>
                      <option value="top">Верх</option>
                      <option value="middle">Середина</option>
                      <option value="bottom">Низ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Порядок сортировки <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      placeholder="0"
                      required
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Чем меньше число, тем выше баннер в списке
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Баннер активен</span>
                      {formData.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Icons.Check />
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Icons.X />
                          Неактивен
                        </span>
                      )}
                    </label>
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
                    disabled={uploading}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить баннер'
                    )}
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

