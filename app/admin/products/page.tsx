'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  fillings?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  hinges?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  drawers?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  lighting?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  specs?: { 
    body_material?: string
    facade_material?: string
    additional?: string
    handles?: string
    handle_material?: string
    back_wall_material?: string
    delivery_option?: string
    feet?: string
    country?: string
  } | null
  schemes?: string[] | null
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
  // DnD загрузка галереи
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // DnD для цветов (иконок/свотчей)
  const [uploadingColors, setUploadingColors] = useState(false)
  const colorInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingColors, setIsDraggingColors] = useState(false)
  // DnD для схем товара
  const schemeInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingSchemes, setIsDraggingSchemes] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    images: [] as string[],
    colors: [] as any,
    fillings: [] as any,
    hinges: [] as any,
    drawers: [] as any,
    lighting: [] as any,
    specs: { 
      body_material: '', 
      facade_material: '', 
      additional: '',
      handles: '',
      handle_material: '',
      back_wall_material: '',
      delivery_option: '',
      feet: '',
      country: ''
    } as any,
    schemes: [] as string[],
    category_id: '',
    is_featured: false,
    is_new: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      console.log('Загрузка данных админки...')
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false })

      if (productsError) {
        console.error('Ошибка загрузки товаров:', productsError)
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')

      if (categoriesError) {
        console.error('Ошибка загрузки категорий:', categoriesError)
      }

      console.log('Товары загружены:', productsData?.length || 0)
      console.log('Категории загружены:', categoriesData?.length || 0)

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
      images: [],
      colors: [],
      fillings: [],
      hinges: [],
      drawers: [],
      lighting: [],
      specs: { 
        body_material: '', 
        facade_material: '', 
        additional: '',
        handles: '',
        handle_material: '',
        back_wall_material: '',
        delivery_option: '',
        feet: '',
        country: ''
      },
      schemes: [],
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
      images: (product.images as any) || [],
      colors: (product.colors as any) || [],
      fillings: (product.fillings as any) || [],
      hinges: (product.hinges as any) || [],
      drawers: (product.drawers as any) || [],
      lighting: (product.lighting as any) || [],
      specs: (product.specs as any) || { 
        body_material: '', 
        facade_material: '', 
        additional: '',
        handles: '',
        handle_material: '',
        back_wall_material: '',
        delivery_option: '',
        feet: '',
        country: ''
      },
      schemes: (product.schemes as any) || [],
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

  // Универсальная загрузка файла в Storage в указанный подкаталог
  async function uploadToFolder(file: File, folder: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`
    const { error } = await supabase.storage.from('product').upload(filePath, file)
    if (error) throw error
    const { data } = supabase.storage.from('product').getPublicUrl(filePath)
    return data.publicUrl
  }

  // Загрузка нескольких файлов в Storage -> массив публичных ссылок
  async function uploadGalleryFiles(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `gallery/${fileName}`
      const { error } = await supabase.storage.from('product').upload(filePath, file)
      if (error) throw error
      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // Загрузка свотчей цветов в Storage (возвращает URL)
  async function uploadColorFiles(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `colors/${fileName}`
      const { error } = await supabase.storage.from('product').upload(filePath, file)
      if (error) throw error
      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      urls.push(data.publicUrl)
    }
    return urls
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

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    try {
      setUploadingGallery(true)
      const urls = await uploadGalleryFiles(files)
      setFormData({ ...formData, images: [...formData.images, ...urls] })
    } catch (err) {
      console.error('Ошибка загрузки галереи:', err)
      alert('Не удалось загрузить изображения галереи')
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function handleGalleryDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    try {
      setUploadingGallery(true)
      const urls = await uploadGalleryFiles(files)
      setFormData({ ...formData, images: [...formData.images, ...urls] })
    } catch (err) {
      console.error('Ошибка dnd загрузки:', err)
      alert('Не удалось загрузить файлы')
    } finally {
      setUploadingGallery(false)
    }
  }

  async function handleColorsSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    try {
      setUploadingColors(true)
      const urls = await uploadColorFiles(files)
      const current = Array.isArray(formData.colors) ? (formData.colors as string[]) : (formData.colors ? (formData.colors as string).split(',').map(s=>s.trim()) : [])
      setFormData({ ...formData, colors: [...current, ...urls] })
    } catch (err) {
      console.error('Ошибка загрузки цветов:', err)
      alert('Не удалось загрузить изображения цветов')
    } finally {
      setUploadingColors(false)
      if (colorInputRef.current) colorInputRef.current.value = ''
    }
  }

  async function handleColorsDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingColors(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    try {
      setUploadingColors(true)
      const urls = await uploadColorFiles(files)
      const current = Array.isArray(formData.colors) ? (formData.colors as string[]) : (formData.colors ? (formData.colors as string).split(',').map(s=>s.trim()) : [])
      setFormData({ ...formData, colors: [...current, ...urls] })
    } catch (err) {
      console.error('Ошибка dnd цветов:', err)
      alert('Не удалось загрузить файлы цветов')
    } finally {
      setUploadingColors(false)
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
        images: formData.images,
        colors: Array.isArray(formData.colors) ? formData.colors : [],
        fillings: formData.fillings,
        hinges: formData.hinges,
        drawers: formData.drawers,
        lighting: formData.lighting,
        specs: formData.specs,
        schemes: formData.schemes,
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

                {/* Галерея изображений: drag & drop + выбор файлов */}
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Доп. изображения (Drag & Drop или выберите файлы)</label>
                  <div
                    className={`w-full border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleGalleryDrop}
                  >
                    <p className="mb-2">Перетащите сюда изображения или</p>
                    <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                      Выбрать файлы
                    </button>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
                    {uploadingGallery && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                  </div>

                  {formData.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} className="w-full h-20 object-cover rounded" />
                          <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs" onClick={() => setFormData({ ...formData, images: formData.images.filter((_,i)=>i!==idx) })}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Схемы товара: drag & drop + выбор файлов */}
                <div className="mb-6">
                  <label className="block mb-2 font-semibold">Схемы товара (Drag & Drop или выбрать файлы)</label>
                  <div
                    className={`w-full border-2 ${isDraggingSchemes ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingSchemes(true) }}
                    onDragLeave={() => setIsDraggingSchemes(false)}
                    onDrop={async (e) => {
                      e.preventDefault(); setIsDraggingSchemes(false);
                      const files = Array.from(e.dataTransfer.files || [])
                      if (files.length === 0) return
                      try { setUploadingGallery(true); const urls = await uploadGalleryFiles(files); setFormData({ ...formData, schemes: [...formData.schemes, ...urls] }) } catch(err){ console.error(err); alert('Не удалось загрузить схемы') } finally { setUploadingGallery(false) }
                    }}
                  >
                    <p className="mb-2">Перетащите файлы схем или</p>
                    <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => schemeInputRef.current?.click()} disabled={uploadingGallery}>
                      Выбрать файлы
                    </button>
                    <input ref={schemeInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e)=>{ const files = Array.from(e.target.files||[]); if(files.length===0) return; try{ setUploadingGallery(true); const urls= await uploadGalleryFiles(files); setFormData({ ...formData, schemes: [...formData.schemes, ...urls] }) }catch(err){ console.error(err); alert('Не удалось загрузить схемы') } finally { setUploadingGallery(false); if(schemeInputRef.current) schemeInputRef.current.value='' } }} />
                    {uploadingGallery && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                  </div>
                  {formData.schemes.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {formData.schemes.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} className="w-full h-20 object-cover rounded" />
                          <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs" onClick={() => setFormData({ ...formData, schemes: formData.schemes.filter((_,i)=>i!==idx) })}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Варианты цветов: Drag & Drop (иконки/свотчи) + ручной ввод */}
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Цвета (изображения свотчей, drag & drop или выбрать файлы)</label>
                  <div
                    className={`w-full border-2 ${isDraggingColors ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingColors(true) }}
                    onDragLeave={() => setIsDraggingColors(false)}
                    onDrop={handleColorsDrop}
                  >
                    <p className="mb-2">Перетащите иконки/изображения цветов или</p>
                    <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => colorInputRef.current?.click()} disabled={uploadingColors}>
                      Выбрать файлы
                    </button>
                    <input ref={colorInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleColorsSelect} />
                    {uploadingColors && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                  </div>

                  {/* Альтернатива: ручной ввод значений цвета */}
                  <div className="mt-3">
                    <label className="block mb-2 font-semibold">Или значения цветов (hex/названия, через запятую)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="#000000, #ffffff, red"
                      value={(formData.colors as string[]).filter((v)=>!v.startsWith('http')).join(', ')}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                    />
                  </div>

                  {/* Превью цветов (URL или hex) */}
                  {Array.isArray(formData.colors) && (formData.colors as string[]).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(formData.colors as string[]).map((val, idx) => (
                        <div key={idx} className="relative">
                          {val.startsWith('http') ? (
                            <img src={val} className="w-8 h-8 rounded-full object-cover border" />
                          ) : (
                            <span className="w-8 h-8 rounded-full inline-block border" style={{ background: val }} />
                          )}
                          <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-5 h-5 text-[10px]" onClick={() => setFormData({ ...formData, colors: (formData.colors as string[]).filter((_,i)=>i!==idx) })}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Варианты наполнений */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Варианты наполнений</label>
                    <button type="button" className="px-3 py-1 border rounded" onClick={() => setFormData({ ...formData, fillings: [...formData.fillings, { name: '', description: '', image_url: '', delta_price: 0 }] })}>+ Добавить</button>
                  </div>
                  {(formData.fillings as any[]).map((f, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Название" value={f.name} onChange={(e)=>{
                        const arr=[...formData.fillings]; (arr as any)[idx].name=e.target.value; setFormData({ ...formData, fillings: arr })
                      }} />
                      <input className="px-3 py-2 border rounded" placeholder="URL изображения" value={f.image_url||''} onChange={(e)=>{
                        const arr=[...formData.fillings]; (arr as any)[idx].image_url=e.target.value; setFormData({ ...formData, fillings: arr })
                      }} />
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=e.target.files?.[0]; if(!file) return; 
                        try{ const url= await uploadToFolder(file,'options/fillings'); const arr=[...formData.fillings]; (arr as any)[idx].image_url=url; setFormData({ ...formData, fillings: arr }) }catch(err){ console.error(err); alert('Не удалось загрузить изображение варианта') }
                      }} />
                      <input type="number" className="px-3 py-2 border rounded" placeholder="Δ цена" value={f.delta_price||0} onChange={(e)=>{
                        const arr=[...formData.fillings]; (arr as any)[idx].delta_price= Number(e.target.value); setFormData({ ...formData, fillings: arr })
                      }} />
                      <input className="px-3 py-2 border rounded md:col-span-4" placeholder="Описание" value={f.description||''} onChange={(e)=>{
                        const arr=[...formData.fillings]; (arr as any)[idx].description= e.target.value; setFormData({ ...formData, fillings: arr })
                      }} />
                      <div className="md:col-span-4 text-right">
                        <button type="button" className="text-red-600" onClick={()=> setFormData({ ...formData, fillings: (formData.fillings as any[]).filter((_,i)=>i!==idx) })}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Опции петель */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Петли</label>
                    <button type="button" className="px-3 py-1 border rounded" onClick={() => setFormData({ ...formData, hinges: [...formData.hinges, { name: '', description: '', image_url: '', delta_price: 0 }] })}>+ Добавить</button>
                  </div>
                  {(formData.hinges as any[]).map((h, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Название" value={h.name} onChange={(e)=>{
                        const arr=[...formData.hinges]; (arr as any)[idx].name=e.target.value; setFormData({ ...formData, hinges: arr })
                      }} />
                      <input className="px-3 py-2 border rounded" placeholder="URL изображения" value={h.image_url||''} onChange={(e)=>{
                        const arr=[...formData.hinges]; (arr as any)[idx].image_url=e.target.value; setFormData({ ...formData, hinges: arr })
                      }} />
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=e.target.files?.[0]; if(!file) return; 
                        try{ const url= await uploadToFolder(file,'options/hinges'); const arr=[...formData.hinges]; (arr as any)[idx].image_url=url; setFormData({ ...formData, hinges: arr }) }catch(err){ console.error(err); alert('Не удалось загрузить изображение петли') }
                      }} />
                      <input type="number" className="px-3 py-2 border rounded" placeholder="Δ цена" value={h.delta_price||0} onChange={(e)=>{
                        const arr=[...formData.hinges]; (arr as any)[idx].delta_price= Number(e.target.value); setFormData({ ...formData, hinges: arr })
                      }} />
                      <input className="px-3 py-2 border rounded md:col-span-4" placeholder="Описание" value={h.description||''} onChange={(e)=>{
                        const arr=[...formData.hinges]; (arr as any)[idx].description= e.target.value; setFormData({ ...formData, hinges: arr })
                      }} />
                      <div className="md:col-span-4 text-right">
                        <button type="button" className="text-red-600" onClick={()=> setFormData({ ...formData, hinges: (formData.hinges as any[]).filter((_,i)=>i!==idx) })}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Опции ящиков */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Ящики</label>
                    <button type="button" className="px-3 py-1 border rounded" onClick={() => setFormData({ ...formData, drawers: [...formData.drawers, { name: '', description: '', image_url: '', delta_price: 0 }] })}>+ Добавить</button>
                  </div>
                  {(formData.drawers as any[]).map((d, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Название" value={d.name} onChange={(e)=>{
                        const arr=[...formData.drawers]; (arr as any)[idx].name=e.target.value; setFormData({ ...formData, drawers: arr })
                      }} />
                      <input className="px-3 py-2 border rounded" placeholder="URL изображения" value={d.image_url||''} onChange={(e)=>{
                        const arr=[...formData.drawers]; (arr as any)[idx].image_url=e.target.value; setFormData({ ...formData, drawers: arr })
                      }} />
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=e.target.files?.[0]; if(!file) return; 
                        try{ const url= await uploadToFolder(file,'options/drawers'); const arr=[...formData.drawers]; (arr as any)[idx].image_url=url; setFormData({ ...formData, drawers: arr }) }catch(err){ console.error(err); alert('Не удалось загрузить изображение ящика') }
                      }} />
                      <input type="number" className="px-3 py-2 border rounded" placeholder="Δ цена" value={d.delta_price||0} onChange={(e)=>{
                        const arr=[...formData.drawers]; (arr as any)[idx].delta_price= Number(e.target.value); setFormData({ ...formData, drawers: arr })
                      }} />
                      <input className="px-3 py-2 border rounded md:col-span-4" placeholder="Описание" value={d.description||''} onChange={(e)=>{
                        const arr=[...formData.drawers]; (arr as any)[idx].description= e.target.value; setFormData({ ...formData, drawers: arr })
                      }} />
                      <div className="md:col-span-4 text-right">
                        <button type="button" className="text-red-600" onClick={()=> setFormData({ ...formData, drawers: (formData.drawers as any[]).filter((_,i)=>i!==idx) })}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Опции подсветки */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Подсветка</label>
                    <button type="button" className="px-3 py-1 border rounded" onClick={() => setFormData({ ...formData, lighting: [...formData.lighting, { name: '', description: '', image_url: '', delta_price: 0 }] })}>+ Добавить</button>
                  </div>
                  {(formData.lighting as any[]).map((l, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Название" value={l.name} onChange={(e)=>{
                        const arr=[...formData.lighting]; (arr as any)[idx].name=e.target.value; setFormData({ ...formData, lighting: arr })
                      }} />
                      <input className="px-3 py-2 border rounded" placeholder="URL изображения" value={l.image_url||''} onChange={(e)=>{
                        const arr=[...formData.lighting]; (arr as any)[idx].image_url=e.target.value; setFormData({ ...formData, lighting: arr })
                      }} />
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=e.target.files?.[0]; if(!file) return; 
                        try{ const url= await uploadToFolder(file,'options/lighting'); const arr=[...formData.lighting]; (arr as any)[idx].image_url=url; setFormData({ ...formData, lighting: arr }) }catch(err){ console.error(err); alert('Не удалось загрузить изображение подсветки') }
                      }} />
                      <input type="number" className="px-3 py-2 border rounded" placeholder="Δ цена" value={l.delta_price||0} onChange={(e)=>{
                        const arr=[...formData.lighting]; (arr as any)[idx].delta_price= Number(e.target.value); setFormData({ ...formData, lighting: arr })
                      }} />
                      <input className="px-3 py-2 border rounded md:col-span-4" placeholder="Описание" value={l.description||''} onChange={(e)=>{
                        const arr=[...formData.lighting]; (arr as any)[idx].description= e.target.value; setFormData({ ...formData, lighting: arr })
                      }} />
                      <div className="md:col-span-4 text-right">
                        <button type="button" className="text-red-600" onClick={()=> setFormData({ ...formData, lighting: (formData.lighting as any[]).filter((_,i)=>i!==idx) })}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Характеристики */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Характеристики товара</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold">Материал корпуса</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).body_material) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), body_material: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Материал фасадов</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).facade_material) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), facade_material: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Дополнительно</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).additional) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), additional: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Ручки</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).handles) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), handles: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Материал ручек</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).handle_material) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), handle_material: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Материал задней стенки</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).back_wall_material) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), back_wall_material: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Вариант доставки</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).delivery_option) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), delivery_option: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Подпятники</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).feet) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), feet: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Страна производства</label>
                      <input className="w-full px-3 py-2 border rounded-lg" value={(formData.specs && (formData.specs as any).country) || ''} onChange={(e)=> setFormData({ ...formData, specs: { ...(formData.specs || {}), country: e.target.value } })} />
                    </div>
                  </div>
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

