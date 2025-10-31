'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Category {
  id: number
  name: string
  description: string | null
  image_url: string | null
  slug: string
  is_active: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    is_active: true,
    image_url: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Ошибка загрузки категорий:', error)
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingCategory(null)
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      name: '',
      description: '',
      slug: '',
      is_active: true,
      image_url: '',
    })
    setShowModal(true)
  }

  function openEditModal(category: Category) {
    setEditingCategory(category)
    setSelectedImageFile(null)
    setImagePreview(category.image_url || '')
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      is_active: category.is_active,
      image_url: category.image_url || '',
    })
    setShowModal(true)
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('categories')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('categories')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      
      // Превью изображения
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    
    try {
      let imageUrl = formData.image_url

      // Загружаем изображение, если оно выбрано
      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile)
      }

      const categoryData: any = {
        name: formData.name,
        description: formData.description || null,
        slug: formData.slug || generateSlug(formData.name),
        is_active: formData.is_active,
        image_url: imageUrl || null,
      }

      if (editingCategory) {
        // Обновление
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        // Добавление
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)

        if (error) throw error
      }

      setShowModal(false)
      setSelectedImageFile(null)
      setImagePreview('')
      loadData()
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка при сохранении категории')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить эту категорию?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка при удалении категории')
    }
  }

  function toggleActive(id: number, currentStatus: boolean) {
    supabase
      .from('categories')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .then(() => loadData())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-3 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Управление категориями</h1>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Добавить категорию
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
              {category.image_url && (
                <div className="mb-4">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    category.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {category.is_active ? 'Активна' : 'Неактивна'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL (slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Будет сгенерирован автоматически"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Превью"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Активна
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {uploading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

