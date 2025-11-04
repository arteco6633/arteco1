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
  videos?: string[] | null
  downloadable_files?: Array<{ url: string; name: string }> | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  is_custom_size?: boolean
  related_products?: number[] | null
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
  // DnD для файлов для скачивания
  const filesInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  // Состояния для drag-and-drop перестановки изображений
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null)
  // Состояние для открытия dropdown выбора изображения для цвета
  const [openImageSelect, setOpenImageSelect] = useState<number | null>(null)
  // Состояния для существующих вариантов наполнения из всех товаров
  const [existingFillings, setExistingFillings] = useState<any[]>([])
  const [existingHinges, setExistingHinges] = useState<any[]>([])
  const [existingDrawers, setExistingDrawers] = useState<any[]>([])
  const [existingLighting, setExistingLighting] = useState<any[]>([])
  // Состояния для открытия dropdown выбора существующих вариантов
  const [openExistingFillings, setOpenExistingFillings] = useState(false)
  const [openExistingHinges, setOpenExistingHinges] = useState(false)
  const [openExistingDrawers, setOpenExistingDrawers] = useState(false)
  const [openExistingLighting, setOpenExistingLighting] = useState(false)
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
      country: '',
      custom: [] as Array<{ label: string; value: string }>
    } as any,
    schemes: [] as string[],
    videos: [] as string[],
    downloadable_files: [] as Array<{ url: string; name: string }>,
    category_id: '',
    is_featured: false,
    is_new: false,
    is_custom_size: false,
    related_products: [] as number[],
  })

  useEffect(() => {
    loadData()
  }, [])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openImageSelect !== null && !(event.target as HTMLElement).closest('.image-select-dropdown')) {
        setOpenImageSelect(null)
      }
      if (openExistingFillings && !(event.target as HTMLElement).closest('.existing-options-dropdown')) {
        setOpenExistingFillings(false)
      }
      if (openExistingHinges && !(event.target as HTMLElement).closest('.existing-options-dropdown')) {
        setOpenExistingHinges(false)
      }
      if (openExistingDrawers && !(event.target as HTMLElement).closest('.existing-options-dropdown')) {
        setOpenExistingDrawers(false)
      }
      if (openExistingLighting && !(event.target as HTMLElement).closest('.existing-options-dropdown')) {
        setOpenExistingLighting(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openImageSelect, openExistingFillings, openExistingHinges, openExistingDrawers, openExistingLighting])

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

      // Собираем все существующие варианты наполнения из всех товаров
      const allFillings: any[] = []
      const allHinges: any[] = []
      const allDrawers: any[] = []
      const allLighting: any[] = []

      productsData?.forEach(product => {
        if (product.fillings && Array.isArray(product.fillings)) {
          product.fillings.forEach((f: any) => {
            if (f && f.name && !allFillings.find(ex => ex.name === f.name && ex.description === f.description && ex.image_url === f.image_url)) {
              allFillings.push(f)
            }
          })
        }
        if (product.hinges && Array.isArray(product.hinges)) {
          product.hinges.forEach((h: any) => {
            if (h && h.name && !allHinges.find(ex => ex.name === h.name && ex.description === h.description && ex.image_url === h.image_url)) {
              allHinges.push(h)
            }
          })
        }
        if (product.drawers && Array.isArray(product.drawers)) {
          product.drawers.forEach((d: any) => {
            if (d && d.name && !allDrawers.find(ex => ex.name === d.name && ex.description === d.description && ex.image_url === d.image_url)) {
              allDrawers.push(d)
            }
          })
        }
        if (product.lighting && Array.isArray(product.lighting)) {
          product.lighting.forEach((l: any) => {
            if (l && l.name && !allLighting.find(ex => ex.name === l.name && ex.description === l.description && ex.image_url === l.image_url)) {
              allLighting.push(l)
            }
          })
        }
      })

      setExistingFillings(allFillings)
      setExistingHinges(allHinges)
      setExistingDrawers(allDrawers)
      setExistingLighting(allLighting)
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
      videos: [],
      downloadable_files: [],
      category_id: '',
      is_featured: false,
      is_new: false,
      is_custom_size: false,
      related_products: [],
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
      colors: Array.isArray(product.colors) && product.colors.length > 0
        ? (product.colors as any[]).map(c => {
            if (typeof c === 'string') return { value: c, name: '', imageIndex: null }
            return { value: (c as any).value, name: (c as any).name || '', imageIndex: (c as any).imageIndex ?? null }
          })
        : [],
      fillings: (product.fillings as any) || [],
      hinges: (product.hinges as any) || [],
      drawers: (product.drawers as any) || [],
      lighting: (product.lighting as any) || [],
      specs: ((product.specs as any) && typeof (product.specs as any) === 'object') ? { 
        ...product.specs,
        custom: Array.isArray((product.specs as any).custom) ? (product.specs as any).custom : []
      } : { 
        body_material: '', 
        facade_material: '', 
        additional: '',
        handles: '',
        handle_material: '',
        back_wall_material: '',
        delivery_option: '',
        feet: '',
        country: '',
        custom: []
      },
      schemes: (product.schemes as any) || [],
      videos: (product.videos as any) || [],
      downloadable_files: (product.downloadable_files as any) || [],
      category_id: product.category_id.toString(),
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_custom_size: !!(product as any).is_custom_size,
      related_products: (product as any).related_products || [],
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

  // Загрузка видеофайлов в Storage -> массив публичных ссылок
  async function uploadVideoFiles(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      // Показываем размер файла для информации
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      console.log(`Загрузка видео: ${file.name}, размер: ${fileSizeMB} MB`)
      
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `videos/${fileName}`
      
      // Загружаем с опциями для больших файлов
      const { error } = await supabase.storage
        .from('product')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // Отключаем проверку размера на клиенте, полагаемся на Supabase
        })
      
      if (error) {
        // Улучшенная обработка ошибок
        if (error.message.includes('exceeded') || error.message.includes('maximum') || error.message.includes('size')) {
          throw new Error(`Файл слишком большой (${fileSizeMB} MB). В Supabase Dashboard увеличьте лимит размера файла для бакета "product". Максимальный размер по умолчанию: 50 MB (Free) или 500 MB (Pro).`)
        }
        throw new Error(`Ошибка загрузки: ${error.message}`)
      }
      
      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // Загрузка файлов для скачивания (PDF, DOC и т.д.) в Storage
  async function uploadDownloadableFiles(files: File[]): Promise<Array<{ url: string; name: string }>> {
    const result: Array<{ url: string; name: string }> = []
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const filePath = `downloads/${fileName}`
      const { error } = await supabase.storage.from('product').upload(filePath, file)
      if (error) throw error
      const { data } = supabase.storage.from('product').getPublicUrl(filePath)
      result.push({ url: data.publicUrl, name: file.name })
    }
    return result
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
      const current = Array.isArray(formData.colors) ? formData.colors : []
      const newColors = urls.map(url => ({ value: url, name: '', imageIndex: null as number | null }))
      setFormData({ ...formData, colors: [...current, ...newColors] })
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
      const current = Array.isArray(formData.colors) ? formData.colors : []
      const newColors = urls.map(url => ({ value: url, name: '', imageIndex: null as number | null }))
      setFormData({ ...formData, colors: [...current, ...newColors] })
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
        videos: formData.videos,
        downloadable_files: formData.downloadable_files,
        category_id: parseInt(formData.category_id),
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_custom_size: formData.is_custom_size,
        related_products: formData.related_products,
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
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-gray-100 grid place-items-center text-xs text-gray-400">нет фото</div>
                    )}
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
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {formData.images.map((url, idx) => (
                        <div 
                          key={idx} 
                          className={`relative cursor-move transition-opacity ${
                            draggedImageIndex === idx ? 'opacity-50' : ''
                          } ${dragOverImageIndex === idx ? 'ring-2 ring-blue-500' : ''}`}
                          draggable
                          onDragStart={(e) => {
                            setDraggedImageIndex(idx)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              setDragOverImageIndex(idx)
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverImageIndex(null)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              const newImages = [...formData.images]
                              const [draggedItem] = newImages.splice(draggedImageIndex, 1)
                              newImages.splice(idx, 0, draggedItem)
                              setFormData({ ...formData, images: newImages })
                            }
                            setDraggedImageIndex(null)
                            setDragOverImageIndex(null)
                          }}
                          onDragEnd={() => {
                            setDraggedImageIndex(null)
                            setDragOverImageIndex(null)
                          }}
                        >
                          <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            <img src={url} className="max-w-full max-h-full object-contain rounded pointer-events-none" alt={`Изображение ${idx + 1}`} />
                          </div>
                          <button 
                            type="button" 
                            className="absolute -top-2 -right-2 bg-white rounded-full border w-7 h-7 text-sm hover:bg-red-50 z-10 flex items-center justify-center font-bold" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData({ ...formData, images: formData.images.filter((_,i)=>i!==idx) })
                            }}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm font-semibold text-center py-1.5 rounded-b">
                            {idx + 1}
                          </div>
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

                {/* Спецификация: drag & drop + выбор файлов */}
                <div className="mb-6">
                  <label className="block mb-2 font-semibold">Спецификация (PDF, DOC и т.д.)</label>
                  <div
                    className={`w-full border-2 ${isDraggingFiles ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFiles(true) }}
                    onDragLeave={() => setIsDraggingFiles(false)}
                    onDrop={async (e) => {
                      e.preventDefault(); setIsDraggingFiles(false);
                      const files = Array.from(e.dataTransfer.files || [])
                      if (files.length === 0) return
                      try { 
                        setUploadingFiles(true); 
                        const uploaded = await uploadDownloadableFiles(files); 
                        setFormData({ ...formData, downloadable_files: [...formData.downloadable_files, ...uploaded] }) 
                      } catch(err){ 
                        console.error(err); 
                        alert('Не удалось загрузить файлы') 
                      } finally { 
                        setUploadingFiles(false) 
                      }
                    }}
                  >
                    <p className="mb-2">Перетащите файлы (PDF, DOC, DOCX и т.д.) или</p>
                    <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => filesInputRef.current?.click()} disabled={uploadingFiles}>
                      Выбрать файлы
                    </button>
                    <input ref={filesInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" multiple className="hidden" onChange={async (e)=>{ 
                      const files = Array.from(e.target.files||[]); 
                      if(files.length===0) return; 
                      try{ 
                        setUploadingFiles(true); 
                        const uploaded = await uploadDownloadableFiles(files); 
                        setFormData({ ...formData, downloadable_files: [...formData.downloadable_files, ...uploaded] }) 
                      }catch(err){ 
                        console.error(err); 
                        alert('Не удалось загрузить файлы') 
                      } finally { 
                        setUploadingFiles(false); 
                        if(filesInputRef.current) filesInputRef.current.value='' 
                      } 
                    }} />
                    {uploadingFiles && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                  </div>
                  {formData.downloadable_files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.downloadable_files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <span className="text-sm font-medium">{file.name}</span>
                          </div>
                          <button type="button" className="text-red-600 hover:text-red-800 text-sm" onClick={() => setFormData({ ...formData, downloadable_files: formData.downloadable_files.filter((_,i)=>i!==idx) })}>× Удалить</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Видео товара: drag & drop + выбор файлов */}
                <div className="mb-6">
                  <label className="block mb-2 font-semibold">Видео кухни (Drag & Drop или выбрать файлы)</label>
                  <div
                    className={`w-full border-2 ${isDraggingSchemes ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingSchemes(true) }}
                    onDragLeave={() => setIsDraggingSchemes(false)}
                    onDrop={async (e) => {
                      e.preventDefault(); setIsDraggingSchemes(false);
                      const files = Array.from(e.dataTransfer.files || [])
                      if (files.length === 0) return
                      try { 
                        setUploadingGallery(true)
                        const urls = await uploadVideoFiles(files)
                        setFormData({ ...formData, videos: [...formData.videos, ...urls] })
                      } catch(err: any){ 
                        console.error(err)
                        alert(err?.message || 'Не удалось загрузить видео')
                      } finally { 
                        setUploadingGallery(false) 
                      }
                    }}
                  >
                    <p className="mb-2">Перетащите видео (mp4/mov) или</p>
                    <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={() => document.getElementById('videoInputHidden')?.click()} disabled={uploadingGallery}>
                      Выбрать файлы
                    </button>
                    <input id="videoInputHidden" type="file" accept="video/*" multiple className="hidden" onChange={async (e)=>{ 
                      const files = Array.from(e.target.files||[])
                      if(files.length===0) return
                      try{ 
                        setUploadingGallery(true)
                        const urls = await uploadVideoFiles(files)
                        setFormData({ ...formData, videos: [...formData.videos, ...urls] })
                      } catch(err: any) { 
                        console.error(err)
                        alert(err?.message || 'Не удалось загрузить видео')
                      } finally { 
                        setUploadingGallery(false)
                        ;(e.target as HTMLInputElement).value=''
                      }
                    }} />
                    {uploadingGallery && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                  </div>
                  {formData.videos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.videos.map((url, idx) => (
                        <div key={idx} className="relative">
                          <video src={url} className="w-full rounded" controls muted />
                          <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs" onClick={() => setFormData({ ...formData, videos: formData.videos.filter((_,i)=>i!==idx) })}>×</button>
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
                      onChange={(e) => {
                        const hexValues = e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                        const newColors = hexValues.map(val => ({ value: val, name: '', imageIndex: null as number | null }))
                        // Сохраняем существующие цвета (с изображениями) и добавляем новые hex
                        const existing = Array.isArray(formData.colors) ? formData.colors.filter((c: any) => 
                          typeof c === 'object' && c.value && c.value.startsWith('http')
                        ) : []
                        setFormData({ ...formData, colors: [...existing, ...newColors] })
                      }}
                    />
                  </div>

                  {/* Превью и управление цветами с выбором изображений */}
                  {Array.isArray(formData.colors) && (formData.colors as any[]).length > 0 && (
                    <div className="mt-3 space-y-3">
                      {(formData.colors as any[]).map((colorItem, idx) => {
                        // Обработка старого формата (строка) и нового (объект)
                        const colorValue = typeof colorItem === 'string' ? colorItem : (colorItem?.value || colorItem)
                        const colorName = typeof colorItem === 'object' ? (colorItem?.name ?? '') : ''
                        const imageIndex = typeof colorItem === 'object' ? (colorItem?.imageIndex ?? null) : null
                        const isImageUrl = typeof colorValue === 'string' && (colorValue.startsWith('http') || colorValue.startsWith('/'))
                        return (
                          <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="relative">
                                {isImageUrl ? (
                                  <img src={colorValue} className="w-12 h-12 rounded-full object-cover border" />
                                ) : (
                                  <span className="w-12 h-12 rounded-full inline-block border shadow-sm" style={{ background: colorValue || '#ccc' }} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium mb-1">Цвет #{idx + 1}</div>
                                <div className="text-xs text-gray-600">{colorName || (isImageUrl ? 'Изображение свотча' : colorValue)}</div>
                              </div>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Название цвета (для клиента)</label>
                                <input
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Напр. Белая шагрень"
                                  value={colorName}
                                  onChange={(e) => {
                                    const arr = [...(formData.colors as any[])]
                                    const prev = typeof arr[idx] === 'object' ? arr[idx] : { value: arr[idx] }
                                    arr[idx] = { ...prev, name: e.target.value }
                                    setFormData({ ...formData, colors: arr })
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Значение (HEX/URL)</label>
                                <input
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  value={colorValue}
                                  onChange={(e) => {
                                    const arr = [...(formData.colors as any[])]
                                    const prev = typeof arr[idx] === 'object' ? arr[idx] : { value: arr[idx] }
                                    arr[idx] = { ...prev, value: e.target.value }
                                    setFormData({ ...formData, colors: arr })
                                  }}
                                />
                              </div>
                            </div>
                              <button type="button" className="text-red-600 hover:text-red-800" onClick={() => {
                                const arr = [...(formData.colors as any[])]
                                arr.splice(idx, 1)
                                setFormData({ ...formData, colors: arr })
                              }}>× Удалить</button>
                            </div>
                            <div className="mt-2 relative image-select-dropdown">
                              <label className="block text-xs text-gray-600 mb-1">Связать с изображением из галереи:</label>
                              <button
                                type="button"
                                className="w-full px-2 py-1 border rounded text-sm text-left flex items-center justify-between hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenImageSelect(openImageSelect === idx ? null : idx)
                                }}
                              >
                                <span>
                                  {imageIndex !== null && formData.images[imageIndex] 
                                    ? `Изображение ${imageIndex + 1}` 
                                    : 'Не связывать'}
                                </span>
                                <span className="text-gray-400">{openImageSelect === idx ? '▲' : '▼'}</span>
                              </button>
                              {openImageSelect === idx && (
                                <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${
                                      imageIndex === null ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => {
                                      const arr = [...(formData.colors as any[])]
                                      const prev = typeof arr[idx] === 'object' ? arr[idx] : { value: arr[idx] }
                                      arr[idx] = { ...prev, imageIndex: null }
                                      setFormData({ ...formData, colors: arr })
                                      setOpenImageSelect(null)
                                    }}
                                  >
                                    <span className="text-sm">Не связывать</span>
                                  </button>
                                  {formData.images.map((imgUrl, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-100 ${
                                        imageIndex === imgIdx ? 'bg-blue-50' : ''
                                      }`}
                                      onClick={() => {
                                        const arr = [...(formData.colors as any[])]
                                        const prev = typeof arr[idx] === 'object' ? arr[idx] : { value: arr[idx] }
                                        arr[idx] = { ...prev, imageIndex: imgIdx }
                                        setFormData({ ...formData, colors: arr })
                                        setOpenImageSelect(null)
                                      }}
                                    >
                                      <img 
                                        src={imgUrl} 
                                        alt={`Изображение ${imgIdx + 1}`} 
                                        className="w-12 h-12 object-contain rounded border bg-gray-50 flex-shrink-0" 
                                      />
                                      <span className="text-sm">Изображение {imgIdx + 1}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {imageIndex !== null && formData.images[imageIndex] && (
                                <div className="mt-2">
                                  <img src={formData.images[imageIndex]} alt={`Привязанное изображение`} className="w-20 h-20 object-contain rounded border bg-gray-100" />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Варианты наполнений */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Варианты наполнений</label>
                    <div className="relative existing-options-dropdown">
                      <button 
                        type="button" 
                        className="px-3 py-1 border rounded hover:bg-gray-50" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenExistingFillings(!openExistingFillings)
                          setOpenExistingHinges(false)
                          setOpenExistingDrawers(false)
                          setOpenExistingLighting(false)
                        }}
                      >
                        + Добавить {openExistingFillings ? '▲' : '▼'}
                      </button>
                      {openExistingFillings && (
                        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[300px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
                            onClick={() => {
                              setFormData({ ...formData, fillings: [...formData.fillings, { name: '', description: '', image_url: '', delta_price: 0 }] })
                              setOpenExistingFillings(false)
                            }}
                          >
                            + Создать новый
                          </button>
                          {existingFillings.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Выбрать из существующих:</div>
                              {existingFillings.map((f, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setFormData({ ...formData, fillings: [...formData.fillings, { ...f }] })
                                    setOpenExistingFillings(false)
                                  }}
                                >
                                  {f.image_url && (
                                    <img src={f.image_url} alt={f.name} className="w-10 h-10 object-contain rounded border bg-gray-50 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{f.name || 'Без названия'}</div>
                                    {f.description && <div className="text-xs text-gray-500">{f.description}</div>}
                                    {f.delta_price !== undefined && <div className="text-xs text-gray-500">Δ цена: {f.delta_price} ₽</div>}
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
                    <div className="relative existing-options-dropdown">
                      <button 
                        type="button" 
                        className="px-3 py-1 border rounded hover:bg-gray-50" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenExistingHinges(!openExistingHinges)
                          setOpenExistingFillings(false)
                          setOpenExistingDrawers(false)
                          setOpenExistingLighting(false)
                        }}
                      >
                        + Добавить {openExistingHinges ? '▲' : '▼'}
                      </button>
                      {openExistingHinges && (
                        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[300px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
                            onClick={() => {
                              setFormData({ ...formData, hinges: [...formData.hinges, { name: '', description: '', image_url: '', delta_price: 0 }] })
                              setOpenExistingHinges(false)
                            }}
                          >
                            + Создать новый
                          </button>
                          {existingHinges.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Выбрать из существующих:</div>
                              {existingHinges.map((h, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setFormData({ ...formData, hinges: [...formData.hinges, { ...h }] })
                                    setOpenExistingHinges(false)
                                  }}
                                >
                                  {h.image_url && (
                                    <img src={h.image_url} alt={h.name} className="w-10 h-10 object-contain rounded border bg-gray-50 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{h.name || 'Без названия'}</div>
                                    {h.description && <div className="text-xs text-gray-500">{h.description}</div>}
                                    {h.delta_price !== undefined && <div className="text-xs text-gray-500">Δ цена: {h.delta_price} ₽</div>}
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
                    <div className="relative existing-options-dropdown">
                      <button 
                        type="button" 
                        className="px-3 py-1 border rounded hover:bg-gray-50" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenExistingDrawers(!openExistingDrawers)
                          setOpenExistingFillings(false)
                          setOpenExistingHinges(false)
                          setOpenExistingLighting(false)
                        }}
                      >
                        + Добавить {openExistingDrawers ? '▲' : '▼'}
                      </button>
                      {openExistingDrawers && (
                        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[300px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
                            onClick={() => {
                              setFormData({ ...formData, drawers: [...formData.drawers, { name: '', description: '', image_url: '', delta_price: 0 }] })
                              setOpenExistingDrawers(false)
                            }}
                          >
                            + Создать новый
                          </button>
                          {existingDrawers.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Выбрать из существующих:</div>
                              {existingDrawers.map((d, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setFormData({ ...formData, drawers: [...formData.drawers, { ...d }] })
                                    setOpenExistingDrawers(false)
                                  }}
                                >
                                  {d.image_url && (
                                    <img src={d.image_url} alt={d.name} className="w-10 h-10 object-contain rounded border bg-gray-50 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{d.name || 'Без названия'}</div>
                                    {d.description && <div className="text-xs text-gray-500">{d.description}</div>}
                                    {d.delta_price !== undefined && <div className="text-xs text-gray-500">Δ цена: {d.delta_price} ₽</div>}
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
                    <div className="relative existing-options-dropdown">
                      <button 
                        type="button" 
                        className="px-3 py-1 border rounded hover:bg-gray-50" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenExistingLighting(!openExistingLighting)
                          setOpenExistingFillings(false)
                          setOpenExistingHinges(false)
                          setOpenExistingDrawers(false)
                        }}
                      >
                        + Добавить {openExistingLighting ? '▲' : '▼'}
                      </button>
                      {openExistingLighting && (
                        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[300px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
                            onClick={() => {
                              setFormData({ ...formData, lighting: [...formData.lighting, { name: '', description: '', image_url: '', delta_price: 0 }] })
                              setOpenExistingLighting(false)
                            }}
                          >
                            + Создать новый
                          </button>
                          {existingLighting.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Выбрать из существующих:</div>
                              {existingLighting.map((l, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setFormData({ ...formData, lighting: [...formData.lighting, { ...l }] })
                                    setOpenExistingLighting(false)
                                  }}
                                >
                                  {l.image_url && (
                                    <img src={l.image_url} alt={l.name} className="w-10 h-10 object-contain rounded border bg-gray-50 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{l.name || 'Без названия'}</div>
                                    {l.description && <div className="text-xs text-gray-500">{l.description}</div>}
                                    {l.delta_price !== undefined && <div className="text-xs text-gray-500">Δ цена: {l.delta_price} ₽</div>}
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
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

                  {/* Дополнительные характеристики */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold">Дополнительные характеристики</label>
                      <button
                        type="button"
                        className="px-3 py-1 border rounded hover:bg-gray-50"
                        onClick={() => {
                          const current = (formData.specs as any)?.custom || []
                          setFormData({ ...formData, specs: { ...(formData.specs as any), custom: [...current, { label: '', value: '' }] } })
                        }}
                      >
                        + Добавить
                      </button>
                    </div>
                    {Array.isArray((formData.specs as any)?.custom) && (formData.specs as any).custom.length > 0 && (
                      <div className="space-y-2">
                        {(formData.specs as any).custom.map((row: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                            <input
                              className="md:col-span-2 px-3 py-2 border rounded"
                              placeholder="Название характеристики"
                              value={row.label || ''}
                              onChange={(e) => {
                                const list = [ ...((formData.specs as any).custom || []) ]
                                list[idx] = { ...list[idx], label: e.target.value }
                                setFormData({ ...formData, specs: { ...(formData.specs as any), custom: list } })
                              }}
                            />
                            <input
                              className="md:col-span-3 px-3 py-2 border rounded"
                              placeholder="Значение"
                              value={row.value || ''}
                              onChange={(e) => {
                                const list = [ ...((formData.specs as any).custom || []) ]
                                list[idx] = { ...list[idx], value: e.target.value }
                                setFormData({ ...formData, specs: { ...(formData.specs as any), custom: list } })
                              }}
                            />
                            <button
                              type="button"
                              className="px-3 py-2 border rounded text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const list = [ ...((formData.specs as any).custom || []) ]
                                list.splice(idx, 1)
                                setFormData({ ...formData, specs: { ...(formData.specs as any), custom: list } })
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_custom_size}
                      onChange={(e) => setFormData({ ...formData, is_custom_size: e.target.checked })}
                    />
                    <span className="font-semibold">Под любые размеры</span>
                  </label>
                </div>

                {/* Дополнительные товары (для рекомендаций в корзине) */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Дополнительные товары (рекомендации)</label>
                    <span className="text-xs text-gray-500">Отмеченные товары покажутся внизу корзины</span>
                  </div>
                  <div className="max-h-64 overflow-auto border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <input
                          type="checkbox"
                          checked={formData.related_products.includes(p.id)}
                          onChange={(e) => {
                            const exists = formData.related_products.includes(p.id)
                            const next = exists
                              ? formData.related_products.filter(id => id !== p.id)
                              : [...formData.related_products, p.id]
                            setFormData({ ...formData, related_products: next })
                          }}
                        />
                        <img src={p.image_url} className="w-10 h-10 rounded object-cover" />
                        <span className="text-sm line-clamp-1">{p.name}</span>
                      </label>
                    ))}
                  </div>
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

