'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
// Navbar удалён для админ-панели

interface PromoBlock {
  id: number
  title: string
  description: string | null
  image_url: string
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
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

      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile)
      }

      const bannerData = {
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        link_url: formData.link_url || null,
        button_text: formData.button_text || null,
        position: formData.position,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order),
      }

      if (editingBanner) {
        const { error } = await supabase
          .from('promo_blocks')
          .update(bannerData)
          .eq('id', editingBanner.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('promo_blocks')
          .insert(bannerData)

        if (error) throw error
      }

      setShowModal(false)
      setSelectedImageFile(null)
      setImagePreview('')
      loadData()
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка при сохранении баннера')
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  // Иконки
  const Icons = {
    Check: () => (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    X: () => (
      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Хедер */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Управление баннерами</h1>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Позиция</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Порядок</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Активен</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Изображение</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{banner.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{banner.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{banner.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{banner.sort_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {banner.is_active ? (
                        <span className="inline-flex items-center">
                          <Icons.Check />
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Icons.X />
                        </span>
                      )}
                    </td>
                  <td>
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="btn btn-secondary mr-2"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="btn btn-danger"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b shadow-sm z-10 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl font-bold">
                {editingBanner ? 'Редактировать баннер' : 'Добавить баннер'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
                disabled={uploading}
              >
                ×
              </button>
            </div>
          </div>

          <div className="container mx-auto p-4 md:p-6 max-w-4xl">
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Название</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Описание</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-lg"
                    onChange={handleImageSelect}
                  />
                  {(imagePreview || formData.image_url) && (
                    <div className="mt-4">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Превью"
                        className="w-96 h-64 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">
                    URL изображения (или загрузите файл выше)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Ссылка (URL)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Текст кнопки</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Перейти в каталог"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Позиция</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
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

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Порядок сортировки</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="font-semibold">Активен</span>
                  </label>
                </div>

                <div className="sticky bottom-0 bg-white border-t py-4 mt-6">
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                      disabled={uploading}
                    >
                      Отмена
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                      disabled={uploading}
                    >
                      {uploading ? 'Сохранение...' : 'Сохранить'}
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

