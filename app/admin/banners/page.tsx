'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

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
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB')
        return
      }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="text-3xl font-bold">Управление баннерами</h1>
          <button onClick={openAddModal} className="btn btn-primary">
            + Добавить баннер
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Позиция</th>
                <th>Порядок</th>
                <th>Активен</th>
                <th>Изображение</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td>{banner.id}</td>
                  <td>{banner.title}</td>
                  <td>{banner.position}</td>
                  <td>{banner.sort_order}</td>
                  <td>{banner.is_active ? '✅' : '❌'}</td>
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
    </div>
  )
}

