'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string
  category_id: number
  is_featured: boolean
  is_new: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: '',
    is_featured: false,
    is_new: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false })

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')

      setProducts(productsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingProduct(null)
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category_id: '',
      is_featured: false,
      is_new: false,
    })
    setShowModal(true)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url,
      category_id: product.category_id.toString(),
      is_featured: product.is_featured,
      is_new: product.is_new,
    })
    setShowModal(true)
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

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
      
      // Превью изображения
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

      // Загружаем изображение, если оно выбрано
      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile)
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        category_id: parseInt(formData.category_id),
        is_featured: formData.is_featured,
        is_new: formData.is_new,
      }

      if (editingProduct) {
        // Обновление
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // Добавление
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
      }

      setShowModal(false)
      setSelectedImageFile(null)
      setImagePreview('')
      loadData()
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка при сохранении товара')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить этот товар?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка при удалении товара')
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
          <h1 className="text-3xl font-bold">Управление товарами</h1>
          <button onClick={openAddModal} className="btn btn-primary">
            + Добавить товар
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Категория</th>
                <th>Изображение</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.price} ₽</td>
                  <td>{product.category_id}</td>
                  <td>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => openEditModal(product)}
                      className="btn btn-secondary mr-2"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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

        {/* Модальное окно - Полноэкранное */}
        {showModal && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Шапка с кнопкой закрытия */}
            <div className="sticky top-0 bg-white border-b shadow-sm z-10 p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h2 className="text-2xl md:text-3xl font-bold">
                  {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
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

            {/* Контент формы */}
            <div className="container mx-auto p-4 md:p-6 max-w-4xl">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Название</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Цена</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
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
                        className="w-48 h-48 object-cover rounded-lg border"
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
                  <label className="block mb-2 font-semibold">Категория</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Флаги товара */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <span className="font-semibold">Рекомендуемый</span>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    />
                    <span className="font-semibold">Новинка</span>
                  </label>
                </div>

                {/* Кнопки действий - закреплены внизу */}
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

