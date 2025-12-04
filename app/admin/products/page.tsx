'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Минималистичные SVG иконки
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
  Stock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
}

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  original_price?: number | null
  price_type?: 'fixed' | 'per_m2' | null
  price_per_m2?: number | null
  sku?: string | null
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  handles?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
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
  interior_images?: string[] | null
  model_3d_url?: string | null
  category_id: number
  is_featured: boolean
  is_new: boolean
  is_custom_size?: boolean
  is_fast_delivery?: boolean
  is_hidden?: boolean
  related_products?: number[] | null
  color_products?: Record<string, number> | null
  rich_content?: Array<{ title: string; description: string; image_url?: string; video_url?: string }> | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
  // DnD для изображений интерьера
  const interiorInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingInterior, setIsDraggingInterior] = useState(false)
  const [uploadingInterior, setUploadingInterior] = useState(false)
  // DnD для файлов для скачивания
  const filesInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  // Загрузка 3D модели
  const [selected3DModelFile, setSelected3DModelFile] = useState<File | null>(null)
  const [uploading3DModel, setUploading3DModel] = useState(false)
  const model3DInputRef = useRef<HTMLInputElement | null>(null)
  // Состояния для drag-and-drop перестановки изображений
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null)
  // Состояние для открытия dropdown выбора изображения для цвета
  const [openImageSelect, setOpenImageSelect] = useState<number | null>(null)
  // Состояния для существующих вариантов наполнения из всех товаров
  const [existingHandles, setExistingHandles] = useState<any[]>([])
  const [existingFillings, setExistingFillings] = useState<any[]>([])
  const [existingHinges, setExistingHinges] = useState<any[]>([])
  const [existingDrawers, setExistingDrawers] = useState<any[]>([])
  const [existingLighting, setExistingLighting] = useState<any[]>([])
  // Состояния для открытия dropdown выбора существующих вариантов
  const [openExistingHandles, setOpenExistingHandles] = useState(false)
  const [openExistingFillings, setOpenExistingFillings] = useState(false)
  const [openExistingHinges, setOpenExistingHinges] = useState(false)
  const [openExistingDrawers, setOpenExistingDrawers] = useState(false)
  const [openExistingLighting, setOpenExistingLighting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    price_type: 'fixed' as 'fixed' | 'per_m2',
    price_per_m2: '',
    sku: '',
    image_url: '',
    images: [] as string[],
    colors: [] as any,
    handles: [] as any,
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
    interior_images: [] as string[],
    model_3d_url: '' as string,
    category_id: '',
    is_featured: false,
    is_new: false,
    is_custom_size: false,
    is_fast_delivery: false,
    is_hidden: false,
    related_products: [] as number[],
    color_products: {} as Record<string, number>,
    rich_content: [] as Array<{ title: string; description: string; image_url?: string; video_url?: string }>,
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
      if (openExistingHandles && !(event.target as HTMLElement).closest('.existing-options-dropdown')) {
        setOpenExistingHandles(false)
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
  }, [openImageSelect, openExistingHandles, openExistingFillings, openExistingHinges, openExistingDrawers, openExistingLighting])

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
      const allHandles: any[] = []
      const allFillings: any[] = []
      const allHinges: any[] = []
      const allDrawers: any[] = []
      const allLighting: any[] = []

      productsData?.forEach(product => {
        if (product.handles && Array.isArray(product.handles)) {
          product.handles.forEach((h: any) => {
            if (h && h.name && !allHandles.find(ex => ex.name === h.name && ex.description === h.description && ex.image_url === h.image_url)) {
              allHandles.push(h)
            }
          })
        }
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

      setExistingHandles(allHandles)
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
      original_price: '',
      price_type: 'fixed' as 'fixed' | 'per_m2',
      price_per_m2: '',
      sku: '',
      image_url: '',
      images: [],
      colors: [],
      handles: [],
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
      interior_images: [],
      model_3d_url: '',
      category_id: '',
      is_featured: false,
      is_new: false,
      is_custom_size: false,
      is_fast_delivery: false,
      is_hidden: false,
      related_products: [],
      color_products: {},
      rich_content: [],
    })
    setShowModal(true)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setSelectedImageFile(null)
    setImagePreview('')
    setSelected3DModelFile(null)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: (product.original_price || '').toString(),
      price_type: (product.price_type as 'fixed' | 'per_m2') || 'fixed',
      price_per_m2: product.price_per_m2 ? product.price_per_m2.toString() : '',
      sku: (product.sku || '').toString(),
      image_url: product.image_url,
      images: (product.images as any) || [],
      colors: Array.isArray(product.colors) && product.colors.length > 0
        ? (product.colors as any[]).map(c => {
            if (typeof c === 'string') return { value: c, name: '', imageIndex: null }
            return { value: (c as any).value, name: (c as any).name || '', imageIndex: (c as any).imageIndex ?? null }
          })
        : [],
      handles: (product.handles as any) || [],
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
      interior_images: (product.interior_images as any) || [],
      model_3d_url: (product.model_3d_url || '') as string,
      category_id: product.category_id.toString(),
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_custom_size: !!(product as any).is_custom_size,
      is_fast_delivery: !!(product as any).is_fast_delivery,
      is_hidden: !!(product as any).is_hidden,
      related_products: (product as any).related_products || [],
      color_products: ((product as any).color_products && typeof (product as any).color_products === 'object') 
        ? (product as any).color_products 
        : {},
      rich_content: Array.isArray((product as any).rich_content) 
        ? (product as any).rich_content 
        : [],
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

  // Функция для удаления файла из Supabase Storage
  async function deleteFileFromStorage(url: string): Promise<void> {
    if (!url) return
    
    try {
      // Извлекаем путь к файлу из URL
      // URL формат: https://zijajicude.beget.app/storage/v1/object/public/product/path/to/file.jpg
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/product\/(.+)/)
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1]
        const { error } = await supabase.storage
          .from('product')
          .remove([filePath])
        
        if (error) {
          console.warn('Не удалось удалить файл из Storage:', filePath, error)
          // Не бросаем ошибку, чтобы не блокировать сохранение
        } else {
          console.log('✓ Старый файл удален:', filePath)
        }
      }
    } catch (error) {
      console.warn('Ошибка при удалении файла:', error)
      // Не бросаем ошибку, чтобы не блокировать сохранение
    }
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
      // Сохраняем старый URL для удаления после загрузки нового
      const oldImageUrl = editingProduct?.image_url
      const oldModel3DUrl = editingProduct?.model_3d_url || null

      // Загружаем 3D модель, если она выбрана
      let model3DUrl = formData.model_3d_url
      if (selected3DModelFile) {
        try {
          model3DUrl = await uploadToFolder(selected3DModelFile, 'products/3d-models')
          console.log('✓ 3D модель загружена:', model3DUrl)
          
          // Удаляем старую модель, если она была заменена
          if (oldModel3DUrl && oldModel3DUrl !== model3DUrl) {
            await deleteFileFromStorage(oldModel3DUrl)
          }
        } catch (error) {
          console.error('Ошибка загрузки 3D модели:', error)
          alert('Ошибка при загрузке 3D модели. Попробуйте еще раз.')
          setUploading(false)
          return
        }
      }

      // Загружаем изображение, если оно выбрано
      if (selectedImageFile) {
        try {
          imageUrl = await uploadImage(selectedImageFile)
          console.log('✓ Изображение загружено:', imageUrl)
          
          // Удаляем старое изображение, если оно было заменено
          if (oldImageUrl && oldImageUrl !== imageUrl) {
            await deleteFileFromStorage(oldImageUrl)
          }
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error)
          alert('Ошибка при загрузке изображения. Попробуйте еще раз.')
          setUploading(false)
          return
        }
      } else if (!editingProduct && !formData.image_url) {
        // Для нового товара без изображения показываем предупреждение
        if (!confirm('Вы не выбрали изображение для товара. Продолжить без изображения?')) {
          setUploading(false)
          return
        }
      }

      // Фильтруем пустые значения из массивов
      const filteredInteriorImages = Array.isArray(formData.interior_images) 
        ? formData.interior_images.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
        : []
      
      const filteredImages = Array.isArray(formData.images)
        ? formData.images.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
        : []
      
      const filteredSchemes = Array.isArray(formData.schemes)
        ? formData.schemes.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
        : []
      
      const filteredVideos = Array.isArray(formData.videos)
        ? formData.videos.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
        : []

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        price_type: formData.price_type || 'fixed',
        price_per_m2: formData.price_per_m2 ? parseFloat(formData.price_per_m2) : null,
        sku: formData.sku || null,
        image_url: imageUrl,
        images: filteredImages,
        colors: Array.isArray(formData.colors) ? formData.colors : [],
        handles: formData.handles,
        fillings: formData.fillings,
        hinges: formData.hinges,
        drawers: formData.drawers,
        lighting: formData.lighting,
        specs: formData.specs,
        schemes: filteredSchemes,
        videos: filteredVideos,
      downloadable_files: formData.downloadable_files,
      interior_images: filteredInteriorImages,
      model_3d_url: model3DUrl || null,
      category_id: parseInt(formData.category_id),
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_custom_size: formData.is_custom_size,
        is_fast_delivery: formData.is_fast_delivery,
        is_hidden: formData.is_hidden,
        related_products: formData.related_products,
        color_products: formData.color_products || {},
        rich_content: formData.rich_content || [],
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
      setEditingProduct(null)
      // Сбрасываем input файла, чтобы можно было выбрать тот же файл снова
      const imageInput = document.getElementById('main-product-image-input') as HTMLInputElement
      if (imageInput) {
        imageInput.value = ''
      }
      loadData()
    } catch (error: any) {
      console.error('Ошибка сохранения:', error)
      const errorMessage = error?.message || error?.details || 'Неизвестная ошибка'
      alert(`Ошибка при сохранении товара: ${errorMessage}\n\nВозможно, нужно добавить колонку "handles" в таблицу products через SQL скрипт setup_products_handles.sql`)
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

  function handleDuplicate(product: Product) {
    // Копируем товар, добавляя "(копия)" к названию
    setEditingProduct(null) // Сбрасываем editingProduct, чтобы создать новый товар
    setSelectedImageFile(null)
    setImagePreview('')
    setFormData({
      name: `${product.name} (копия)`,
      description: product.description || '',
      price: product.price.toString(),
      original_price: (product.original_price || '').toString(),
      price_type: (product.price_type as 'fixed' | 'per_m2') || 'fixed',
      price_per_m2: product.price_per_m2 ? product.price_per_m2.toString() : '',
      sku: '', // Очищаем SKU, чтобы не было дубликатов
      image_url: product.image_url,
      images: (product.images as any) || [],
      colors: Array.isArray(product.colors) && product.colors.length > 0
        ? (product.colors as any[]).map(c => {
            if (typeof c === 'string') return { value: c, name: '', imageIndex: null }
            return { value: (c as any).value, name: (c as any).name || '', imageIndex: (c as any).imageIndex ?? null }
          })
        : [],
      handles: (product.handles as any) || [],
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
      interior_images: (product.interior_images as any) || [],
      model_3d_url: (product.model_3d_url || '') as string,
      category_id: product.category_id.toString(),
      is_featured: false, // Новый товар не должен быть избранным по умолчанию
      is_new: false, // Новый товар не должен быть новинкой по умолчанию
      is_custom_size: !!(product as any).is_custom_size,
      is_fast_delivery: !!(product as any).is_fast_delivery,
      is_hidden: true, // Скрываем дубликат по умолчанию, чтобы не было дублей в каталоге
      related_products: (product as any).related_products || [],
      color_products: ((product as any).color_products && typeof (product as any).color_products === 'object') 
        ? (product as any).color_products 
        : {},
      rich_content: ((product as any).rich_content && Array.isArray((product as any).rich_content)) 
        ? (product as any).rich_content 
        : [],
    })
    setShowModal(true)
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
              <h1 className="text-2xl font-bold text-gray-900">Управление товарами</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/stock"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Icons.Stock />
                <span>Остатки</span>
              </Link>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Icons.Plus />
                <span>Добавить товар</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С артикулом</div>
            <div className="text-3xl font-bold text-gray-900">
              {products.filter(p => p.sku).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Новинки</div>
            <div className="text-3xl font-bold text-blue-600">
              {products.filter(p => p.is_new).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Рекомендуемые</div>
            <div className="text-3xl font-bold text-purple-600">
              {products.filter(p => p.is_featured).length}
            </div>
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Список товаров</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64 transition-all"
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
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">ID</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[300px]">Товар</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Артикул</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">Цена</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Категория</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Статус</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-64">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products
                  .filter((product) => {
                    if (!searchQuery) return true
                    const query = searchQuery.toLowerCase()
                    return (
                      product.name.toLowerCase().includes(query) ||
                      product.description?.toLowerCase().includes(query) ||
                      product.sku?.toLowerCase().includes(query) ||
                      product.id.toString().includes(query)
                    )
                  })
                  .map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-500">#{product.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 grid place-items-center border border-gray-200">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.sku ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {product.sku}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </span>
                        {product.original_price && (
                          <span className="text-xs text-gray-400 line-through">
                            {product.original_price.toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{product.category_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {product.is_new && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Новинка
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Рекомендуемое
                          </span>
                        )}
                        {product.is_hidden && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Скрыт
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap sticky right-0 bg-white z-10 border-l border-gray-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
                          title="Редактировать товар"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="inline-flex items-center justify-center w-9 h-9 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                          title="Дублировать товар"
                        >
                          <Icons.Copy />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
                          title="Удалить товар"
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

        {/* Модальное окно - Полноэкранное */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
            {/* Шапка с кнопкой закрытия */}
            <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editingProduct ? `ID: ${editingProduct.id}` : 'Заполните все необходимые поля'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={uploading}
                  >
                    <Icons.Close />
                  </button>
                </div>
              </div>
            </div>

            {/* Контент формы */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Основная информация */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Основная информация
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название товара <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Введите название товара"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Опишите товар подробно"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип цены <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="price_type"
                            value="fixed"
                            checked={formData.price_type === 'fixed'}
                            onChange={(e) => setFormData({ ...formData, price_type: e.target.value as 'fixed' | 'per_m2' })}
                            className="mr-2"
                          />
                          <span>За всё</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="price_type"
                            value="per_m2"
                            checked={formData.price_type === 'per_m2'}
                            onChange={(e) => setFormData({ ...formData, price_type: e.target.value as 'fixed' | 'per_m2' })}
                            className="mr-2"
                          />
                          <span>За м²</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.price_type === 'per_m2' ? 'Цена за м²' : 'Цена'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {formData.price_type === 'per_m2' ? '₽/м²' : '₽'}
                        </span>
                      </div>
                    </div>

                    {formData.price_type === 'per_m2' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Площадь для расчета (м²)
                          <span className="ml-2 text-xs text-gray-500 font-normal">(необязательно, для предпросмотра)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={formData.price_per_m2 || ''}
                            onChange={(e) => setFormData({ ...formData, price_per_m2: e.target.value })}
                            placeholder="0.00"
                          />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">м²</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Старая цена
                        <span className="ml-2 text-xs text-gray-500 font-normal">(необязательно)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={formData.original_price}
                          onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">₽</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Артикул (SKU)
                        <span className="ml-2 text-xs text-gray-500 font-normal">(необязательно)</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="15938 или ART-001"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Используется для синхронизации остатков с поставщиками (например, Woodville)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Категория <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        value={String(formData.category_id || '')}
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
                  </div>
                </div>

                {/* Изображения */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Изображения
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Главное изображение
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {(imagePreview || formData.image_url) ? (
                            <img
                              src={imagePreview || formData.image_url}
                              alt="Превью"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors border border-blue-200">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium">
                              {selectedImageFile ? 'Изменить файл' : 'Выбрать файл'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                              id="main-product-image-input"
                            />
                          </label>
                          {selectedImageFile && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              ✓ Выбрано новое изображение: {selectedImageFile.name}
                            </p>
                          )}
                          {!selectedImageFile && formData.image_url && (
                            <p className="text-xs text-gray-500 mt-2">
                              Текущее изображение будет сохранено. Выберите новое, чтобы заменить.
                            </p>
                          )}
                          {!selectedImageFile && !formData.image_url && (
                            <p className="text-xs text-gray-500 mt-2">
                              Рекомендуемый размер: 800x800px. Форматы: JPG, PNG, WebP
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Галерея изображений: drag & drop + выбор файлов */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дополнительные изображения
                      </label>
                      <div
                        className={`w-full border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleGalleryDrop}
                      >
                        <p className="mb-2 text-sm text-gray-600">Перетащите сюда изображения или</p>
                        <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                          Выбрать файлы
                        </button>
                        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
                        {uploadingGallery && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                      </div>

                      {formData.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
                  </div>
                </div>

                {/* Фото в интерьере */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Фото в интерьере
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Изображения товара в интерьере
                    </label>
                    <div
                      className={`w-full border-2 ${isDraggingInterior ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-5 text-center transition-colors`}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingInterior(true) }}
                      onDragLeave={() => setIsDraggingInterior(false)}
                      onDrop={async (e) => {
                        e.preventDefault(); setIsDraggingInterior(false);
                        const files = Array.from(e.dataTransfer.files || [])
                        if (files.length === 0) return
                        try { 
                          setUploadingInterior(true); 
                          const urls = await uploadGalleryFiles(files); 
                          setFormData({ ...formData, interior_images: [...formData.interior_images, ...urls] }) 
                        } catch(err){ 
                          console.error(err); 
                          alert('Не удалось загрузить изображения') 
                        } finally { 
                          setUploadingInterior(false) 
                        }
                      }}
                    >
                      <p className="mb-2 text-sm text-gray-600">Перетащите изображения или</p>
                      <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => interiorInputRef.current?.click()} disabled={uploadingInterior}>
                        Выбрать файлы
                      </button>
                      <input ref={interiorInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e)=>{ 
                        const files = Array.from(e.target.files||[]); 
                        if(files.length===0) return; 
                        try{ 
                          setUploadingInterior(true); 
                          const urls= await uploadGalleryFiles(files); 
                          setFormData({ ...formData, interior_images: [...formData.interior_images, ...urls] }) 
                        }catch(err){ 
                          console.error(err); 
                          alert('Не удалось загрузить изображения') 
                        } finally { 
                          setUploadingInterior(false); 
                          if(interiorInputRef.current) interiorInputRef.current.value='' 
                        } 
                      }} />
                      {uploadingInterior && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                    </div>
                    {formData.interior_images.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {formData.interior_images.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img src={url} className="w-full h-32 object-cover rounded-lg" alt={`Интерьер ${idx + 1}`} />
                            <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs hover:bg-red-50 transition-colors flex items-center justify-center" onClick={() => setFormData({ ...formData, interior_images: formData.interior_images.filter((_,i)=>i!==idx) })}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Схемы товара */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Схемы и файлы
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Схемы товара
                      </label>
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
                        <p className="mb-2 text-sm text-gray-600">Перетащите файлы схем или</p>
                        <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => schemeInputRef.current?.click()} disabled={uploadingGallery}>
                          Выбрать файлы
                        </button>
                        <input ref={schemeInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e)=>{ const files = Array.from(e.target.files||[]); if(files.length===0) return; try{ setUploadingGallery(true); const urls= await uploadGalleryFiles(files); setFormData({ ...formData, schemes: [...formData.schemes, ...urls] }) }catch(err){ console.error(err); alert('Не удалось загрузить схемы') } finally { setUploadingGallery(false); if(schemeInputRef.current) schemeInputRef.current.value='' } }} />
                        {uploadingGallery && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
                      </div>
                      {formData.schemes.length > 0 && (
                        <div className="mt-4 grid grid-cols-5 gap-2">
                          {formData.schemes.map((url, idx) => (
                            <div key={idx} className="relative">
                              <img src={url} className="w-full h-20 object-cover rounded-lg" />
                              <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs hover:bg-red-50 transition-colors flex items-center justify-center" onClick={() => setFormData({ ...formData, schemes: formData.schemes.filter((_,i)=>i!==idx) })}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Файлы для скачивания */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Файлы для скачивания (PDF, DOC и т.д.)
                      </label>
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
                        <p className="mb-2 text-sm text-gray-600">Перетащите файлы (PDF, DOC, DOCX и т.д.) или</p>
                        <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => filesInputRef.current?.click()} disabled={uploadingFiles}>
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
                        <div className="mt-4 space-y-2">
                          {formData.downloadable_files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                              </div>
                              <button type="button" className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors" onClick={() => setFormData({ ...formData, downloadable_files: formData.downloadable_files.filter((_,i)=>i!==idx) })}>Удалить</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3D модель товара */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        3D модель (OBJ файл)
                        <span className="text-xs text-gray-500 ml-2">Модель можно будет вращать на 360°</span>
                      </label>
                      <div className="space-y-3">
                        {formData.model_3d_url ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">3D модель загружена</p>
                                  <a href={formData.model_3d_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    {formData.model_3d_url.split('/').pop()}
                                  </a>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, model_3d_url: '' })
                                  setSelected3DModelFile(null)
                                  if (model3DInputRef.current) model3DInputRef.current.value = ''
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <div
                          className={`w-full border-2 border-dashed border-gray-300 rounded-lg p-5 text-center transition-colors hover:border-gray-400 ${uploading3DModel ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <p className="mb-2 text-sm text-gray-600">Выберите OBJ файл 3D модели</p>
                          <button 
                            type="button" 
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" 
                            onClick={() => model3DInputRef.current?.click()} 
                            disabled={uploading3DModel}
                          >
                            {uploading3DModel ? 'Загрузка...' : 'Выбрать файл'}
                          </button>
                          <input 
                            ref={model3DInputRef} 
                            type="file" 
                            accept=".obj,.OBJ" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              
                              // Проверяем расширение
                              if (!file.name.toLowerCase().endsWith('.obj')) {
                                alert('Пожалуйста, выберите OBJ файл')
                                if (model3DInputRef.current) model3DInputRef.current.value = ''
                                return
                              }
                              
                              try {
                                setUploading3DModel(true)
                                const url = await uploadToFolder(file, 'products/3d-models')
                                setFormData({ ...formData, model_3d_url: url })
                                setSelected3DModelFile(file)
                                console.log('✓ 3D модель загружена:', url)
                              } catch (err) {
                                console.error('Ошибка загрузки 3D модели:', err)
                                alert('Не удалось загрузить 3D модель')
                              } finally {
                                setUploading3DModel(false)
                                if (model3DInputRef.current) model3DInputRef.current.value = ''
                              }
                            }}
                          />
                          {uploading3DModel && (
                            <div className="mt-2 text-sm text-gray-500">Загрузка 3D модели...</div>
                          )}
                        </div>
                        {formData.model_3d_url && (
                          <p className="text-xs text-gray-500">
                            💡 Если модель загружена, она будет отображаться в карточке товара вместо главного фото. Пользователи смогут вращать её на 360°.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Видео товара */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    Видео товара
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Видео кухни
                      </label>
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
                        <p className="mb-2 text-sm text-gray-600">Перетащите видео (mp4/mov) или</p>
                        <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => document.getElementById('videoInputHidden')?.click()} disabled={uploadingGallery}>
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
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.videos.map((url, idx) => (
                            <div key={idx} className="relative">
                              <video src={url} className="w-full rounded-lg" controls muted />
                              <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full border w-6 h-6 text-xs hover:bg-red-50 transition-colors flex items-center justify-center" onClick={() => setFormData({ ...formData, videos: formData.videos.filter((_,i)=>i!==idx) })}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                            {/* Связывание товара по цвету */}
                            <div className="mt-3">
                              <label className="block text-xs text-gray-600 mb-1">Связать с товаром (при клике на цвет откроется этот товар):</label>
                              <select
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={formData.color_products?.[idx.toString()] || ''}
                                onChange={(e) => {
                                  const newColorProducts = { ...formData.color_products }
                                  if (e.target.value) {
                                    newColorProducts[idx.toString()] = parseInt(e.target.value)
                                  } else {
                                    delete newColorProducts[idx.toString()]
                                  }
                                  setFormData({ ...formData, color_products: newColorProducts })
                                }}
                              >
                                <option value="">Не связывать</option>
                                {products
                                  .filter(p => p.id !== editingProduct?.id)
                                  .map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (ID: {p.id})
                                    </option>
                                  ))}
                              </select>
                              {formData.color_products?.[idx.toString()] && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Связан с товаром ID: {formData.color_products[idx.toString()]}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Дополнительный контент под цветами */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-semibold">Дополнительный контент под цветами</label>
                    <button
                      type="button"
                      className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                      onClick={() => {
                        const newRichContent = [...(formData.rich_content || []), { title: '', description: '', image_url: '', video_url: '' }]
                        setFormData({ ...formData, rich_content: newRichContent })
                      }}
                    >
                      + Добавить блок
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Предустановленные блоки */}
                    {[
                      { key: 'fits_any_interior', title: 'Впишется в любой интерьер' },
                      { key: 'careful_packaging', title: 'Упакуем аккуратно' },
                      { key: 'easy_assembly', title: 'Легкая сборка' }
                    ].map((block) => {
                      const existingBlock = formData.rich_content?.find(b => b.title === block.title) || null
                      const blockIndex = existingBlock ? formData.rich_content?.indexOf(existingBlock) : -1
                      
                      return (
                        <div key={block.key} className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold mb-3">{block.title}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Описание</label>
                              <textarea
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                rows={3}
                                placeholder="Введите описание..."
                                value={existingBlock?.description || ''}
                                onChange={(e) => {
                                  const newRichContent = [...(formData.rich_content || [])]
                                  if (blockIndex >= 0) {
                                    newRichContent[blockIndex] = { ...newRichContent[blockIndex], description: e.target.value }
                                  } else {
                                    newRichContent.push({ title: block.title, description: e.target.value, image_url: '' })
                                  }
                                  setFormData({ ...formData, rich_content: newRichContent })
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Фото/Видео</label>
                              <div className="mb-2 space-y-2">
                                <input
                                  type="file"
                                  accept="image/*,.gif"
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    try {
                                      const url = await uploadToFolder(file, 'rich-content')
                                      const newRichContent = [...(formData.rich_content || [])]
                                      if (blockIndex >= 0) {
                                        newRichContent[blockIndex] = { ...newRichContent[blockIndex], image_url: url, video_url: '' }
                                    } else {
                                      newRichContent.push({ title: block.title, description: existingBlock?.description || '', image_url: url, video_url: '' })
                                    }
                                      setFormData({ ...formData, rich_content: newRichContent })
                                    } catch (err) {
                                      console.error(err)
                                      alert('Не удалось загрузить изображение')
                                    }
                                  }}
                                />
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    try {
                                      const url = await uploadToFolder(file, 'rich-content')
                                      const newRichContent = [...(formData.rich_content || [])]
                                      if (blockIndex >= 0) {
                                        newRichContent[blockIndex] = { ...newRichContent[blockIndex], video_url: url, image_url: '' }
                                      } else {
                                        newRichContent.push({ title: block.title, description: existingBlock?.description || '', video_url: url, image_url: '' })
                                      }
                                      setFormData({ ...formData, rich_content: newRichContent })
                                    } catch (err) {
                                      console.error(err)
                                      alert('Не удалось загрузить видео')
                                    }
                                  }}
                                />
                              </div>
                              {existingBlock?.image_url && (
                                <div className="mt-2">
                                  <div className="w-full max-w-xs aspect-[4/3] overflow-hidden rounded border bg-white flex items-center justify-center">
                                    <img src={existingBlock.image_url} alt={block.title} className="w-full h-full object-contain" />
                                  </div>
                                  <button
                                    type="button"
                                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                                    onClick={() => {
                                      const newRichContent = [...(formData.rich_content || [])]
                                      if (blockIndex >= 0) {
                                        newRichContent[blockIndex] = { ...newRichContent[blockIndex], image_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      }
                                    }}
                                  >
                                    Удалить фото
                                  </button>
                                </div>
                              )}
                              {existingBlock?.video_url && (
                                <div className="mt-2">
                                  <div className="w-full max-w-xs aspect-[4/3] overflow-hidden rounded border bg-black flex items-center justify-center">
                                    <video src={existingBlock.video_url} className="w-full h-full object-contain" controls />
                                  </div>
                                  <button
                                    type="button"
                                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                                    onClick={() => {
                                      const newRichContent = [...(formData.rich_content || [])]
                                      if (blockIndex >= 0) {
                                        newRichContent[blockIndex] = { ...newRichContent[blockIndex], video_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      }
                                    }}
                                  >
                                    Удалить видео
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Пользовательские блоки */}
                    {formData.rich_content
                      ?.filter(block => !['Впишется в любой интерьер', 'Упакуем аккуратно', 'Легкая сборка'].includes(block.title))
                      .map((block, idx) => {
                        const allBlocks = formData.rich_content || []
                        const actualIndex = allBlocks.findIndex(b => b === block)
                        
                        return (
                          <div key={actualIndex} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <input
                                type="text"
                                className="flex-1 px-3 py-2 border rounded-lg text-sm font-semibold"
                                placeholder="Название блока"
                                value={block.title || ''}
                                onChange={(e) => {
                                  const newRichContent = [...(formData.rich_content || [])]
                                  newRichContent[actualIndex] = { ...newRichContent[actualIndex], title: e.target.value }
                                  setFormData({ ...formData, rich_content: newRichContent })
                                }}
                              />
                              <button
                                type="button"
                                className="ml-2 px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                                onClick={() => {
                                  const newRichContent = formData.rich_content?.filter((_, i) => i !== actualIndex) || []
                                  setFormData({ ...formData, rich_content: newRichContent })
                                }}
                              >
                                × Удалить
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Описание</label>
                                <textarea
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  rows={3}
                                  placeholder="Введите описание..."
                                  value={block.description || ''}
                                  onChange={(e) => {
                                    const newRichContent = [...(formData.rich_content || [])]
                                    newRichContent[actualIndex] = { ...newRichContent[actualIndex], description: e.target.value }
                                    setFormData({ ...formData, rich_content: newRichContent })
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Фото/Видео</label>
                                <div className="mb-2 space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*,.gif"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      try {
                                        const url = await uploadToFolder(file, 'rich-content')
                                        const newRichContent = [...(formData.rich_content || [])]
                                        newRichContent[actualIndex] = { ...newRichContent[actualIndex], image_url: url, video_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      } catch (err) {
                                        console.error(err)
                                        alert('Не удалось загрузить изображение')
                                      }
                                    }}
                                  />
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      try {
                                        const url = await uploadToFolder(file, 'rich-content')
                                        const newRichContent = [...(formData.rich_content || [])]
                                        newRichContent[actualIndex] = { ...newRichContent[actualIndex], video_url: url, image_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      } catch (err) {
                                        console.error(err)
                                        alert('Не удалось загрузить видео')
                                      }
                                    }}
                                  />
                                </div>
                                {block.image_url && (
                                  <div className="mt-2">
                                    <div className="w-full max-w-xs aspect-[4/3] overflow-hidden rounded border bg-white flex items-center justify-center">
                                      <img src={block.image_url} alt={block.title || 'Изображение'} className="w-full h-full object-contain" />
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-1 text-xs text-red-600 hover:text-red-800"
                                      onClick={() => {
                                        const newRichContent = [...(formData.rich_content || [])]
                                        newRichContent[actualIndex] = { ...newRichContent[actualIndex], image_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      }}
                                    >
                                      Удалить фото
                                    </button>
                                  </div>
                                )}
                                {block.video_url && (
                                  <div className="mt-2">
                                    <div className="w-full max-w-xs aspect-[4/3] overflow-hidden rounded border bg-black flex items-center justify-center">
                                      <video src={block.video_url} className="w-full h-full object-contain" controls />
                                    </div>
                                    <button
                                      type="button"
                                      className="mt-1 text-xs text-red-600 hover:text-red-800"
                                      onClick={() => {
                                        const newRichContent = [...(formData.rich_content || [])]
                                        newRichContent[actualIndex] = { ...newRichContent[actualIndex], video_url: '' }
                                        setFormData({ ...formData, rich_content: newRichContent })
                                      }}
                                    >
                                      Удалить видео
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Ручки */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Ручки</label>
                    <div className="relative existing-options-dropdown">
                      <button 
                        type="button" 
                        className="px-3 py-1 border rounded hover:bg-gray-50" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenExistingHandles(!openExistingHandles)
                          setOpenExistingFillings(false)
                          setOpenExistingHinges(false)
                          setOpenExistingDrawers(false)
                          setOpenExistingLighting(false)
                        }}
                      >
                        + Добавить {openExistingHandles ? '▲' : '▼'}
                      </button>
                      {openExistingHandles && (
                        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[300px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
                            onClick={() => {
                              setFormData({ ...formData, handles: [...formData.handles, { name: '', description: '', image_url: '', delta_price: 0 }] })
                              setOpenExistingHandles(false)
                            }}
                          >
                            + Создать новый
                          </button>
                          {existingHandles.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Выбрать из существующих:</div>
                              {existingHandles.map((h, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setFormData({ ...formData, handles: [...formData.handles, { ...h }] })
                                    setOpenExistingHandles(false)
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
                  {(formData.handles as any[]).map((h, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Название" value={h.name} onChange={(e)=>{
                        const arr=[...formData.handles]; (arr as any)[idx].name=e.target.value; setFormData({ ...formData, handles: arr })
                      }} />
                      <input className="px-3 py-2 border rounded" placeholder="URL изображения" value={h.image_url||''} onChange={(e)=>{
                        const arr=[...formData.handles]; (arr as any)[idx].image_url=e.target.value; setFormData({ ...formData, handles: arr })
                      }} />
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=e.target.files?.[0]; if(!file) return; 
                        try{ const url= await uploadToFolder(file,'options/handles'); const arr=[...formData.handles]; (arr as any)[idx].image_url=url; setFormData({ ...formData, handles: arr }) }catch(err){ console.error(err); alert('Не удалось загрузить изображение ручки') }
                      }} />
                      <input type="number" className="px-3 py-2 border rounded" placeholder="Δ цена" value={h.delta_price||0} onChange={(e)=>{
                        const arr=[...formData.handles]; (arr as any)[idx].delta_price= Number(e.target.value); setFormData({ ...formData, handles: arr })
                      }} />
                      <input className="px-3 py-2 border rounded md:col-span-4" placeholder="Описание" value={h.description||''} onChange={(e)=>{
                        const arr=[...formData.handles]; (arr as any)[idx].description= e.target.value; setFormData({ ...formData, handles: arr })
                      }} />
                      <div className="md:col-span-4 text-right">
                        <button type="button" className="text-red-600" onClick={()=> setFormData({ ...formData, handles: (formData.handles as any[]).filter((_,i)=>i!==idx) })}>Удалить</button>
                      </div>
                    </div>
                  ))}
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
                          setOpenExistingHandles(false)
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
                          setOpenExistingHandles(false)
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
                          setOpenExistingHandles(false)
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
                          setOpenExistingHandles(false)
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
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <span className="font-semibold">Sale</span>
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
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_fast_delivery}
                      onChange={(e) => setFormData({ ...formData, is_fast_delivery: e.target.checked })}
                    />
                    <span className="font-semibold">Доставим быстро</span>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5"
                      checked={formData.is_hidden}
                      onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                    />
                    <span className="font-semibold">Скрыть товар</span>
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
                        {p.image_url ? (
                          <img src={p.image_url} className="w-10 h-10 rounded object-cover" alt={p.name} />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">нет фото</div>
                        )}
                        <span className="text-sm line-clamp-1">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </form>

              {/* Фиксированная панель с кнопками */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      disabled={uploading}
                    >
                      Отмена
                    </button>
                    <div className="flex items-center gap-3">
                      {uploading && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Сохранение...</span>
                        </div>
                      )}
                      <button 
                        type="submit" 
                        form="product-form"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Сохранение...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Сохранить товар</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

