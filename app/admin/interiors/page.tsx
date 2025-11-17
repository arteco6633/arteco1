'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Interior {
  id: number
  title: string
  subtitle?: string | null
  description?: string | null
  cover_image?: string | null
  gallery_images?: string[] | null
  gallery_previews?: string[] | null
  video_urls?: string[] | null
  document_files?: { url: string; name?: string | null }[] | null
  location?: string | null
  area?: string | null
  style?: string | null
  sort_order?: number | null
  created_at?: string
}

interface InteriorFormData {
  title: string
  subtitle: string
  description: string
  location: string
  area: string
  style: string
  cover_image: string
  gallery_images: string[]
  gallery_previews: string[]
  video_urls: string[]
  document_files: { url: string; name?: string | null }[]
  sort_order: string
}

const emptyForm: InteriorFormData = {
  title: '',
  subtitle: '',
  description: '',
  location: '',
  area: '',
  style: '',
  cover_image: '',
  gallery_images: [],
  gallery_previews: [],
  video_urls: [],
  document_files: [],
  sort_order: '',
}

export default function AdminInteriorsPage() {
  const [interiors, setInteriors] = useState<Interior[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<InteriorFormData>(emptyForm)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadInteriors()
  }, [])

  async function loadInteriors() {
    try {
      setLoading(true)
      let { data, error } = await supabase
        .from('client_interiors')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        const fallback = await supabase
          .from('client_interiors')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      setInteriors(data || [])
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Не удалось загрузить интерьеры')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setForm(emptyForm)
    setActiveId(null)
    setShowModal(true)
  }

  function openEditModal(interior: Interior) {
    setForm({
      title: interior.title || '',
      subtitle: interior.subtitle || '',
      description: interior.description || '',
      location: interior.location || '',
      area: interior.area || '',
      style: interior.style || '',
      cover_image: interior.cover_image || '',
      gallery_images: interior.gallery_images || [],
      gallery_previews: interior.gallery_previews || [],
      video_urls: interior.video_urls || [],
      document_files: interior.document_files || [],
      sort_order: interior.sort_order != null ? interior.sort_order.toString() : '',
    })
    setActiveId(interior.id)
    setShowModal(true)
  }

  async function uploadImage(file: File | Blob, folder: string, originalName?: string) {
    const extFromName = originalName?.split('.').pop()?.toLowerCase()
    const ext = file instanceof File ? file.name.split('.').pop()?.toLowerCase() : extFromName || 'jpg'
    const extension = ext || 'jpg'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('product')
      .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file instanceof File ? file.type : undefined })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function generateImagePreview(file: File, size = 600): Promise<Blob> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    const image = document.createElement('img')
    image.src = dataUrl

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Не удалось загрузить изображение для превью'))
    })

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context is not available')

    const minSide = Math.min(image.width, image.height)
    const sx = (image.width - minSide) / 2
    const sy = (image.height - minSide) / 2

    ctx.drawImage(image, sx, sy, minSide, minSide, 0, 0, size, size)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error('Не удалось сгенерировать превью')
    return blob
  }

  async function uploadVideo(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const fileName = `interiors/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('product')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function uploadDocument(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const fileName = `interiors/documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('product')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data } = supabase.storage
      .from('product')
      .getPublicUrl(fileName)

    return { url: data.publicUrl, name: file.name }
  }

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingCover(true)
      const url = await uploadImage(file, 'interiors')
      setForm((prev) => ({ ...prev, cover_image: url }))
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки обложки')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploadingGallery(true)
      const uploaded: string[] = []
      const uploadedPreviews: string[] = []
      for (const file of files) {
        const [fullUrl, previewBlob] = await Promise.all([
          uploadImage(file, 'interiors'),
          generateImagePreview(file),
        ])
        const previewUrl = await uploadImage(previewBlob, 'interiors/previews', 'preview.jpg')
        uploaded.push(fullUrl)
        uploadedPreviews.push(previewUrl)
      }
      setForm((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...uploaded],
        gallery_previews: [...prev.gallery_previews, ...uploadedPreviews],
      }))
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки галереи')
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  function removeGalleryImage(url: string) {
    setForm((prev) => {
      const index = prev.gallery_images.findIndex((item) => item === url)
      if (index === -1) return prev
      const nextImages = [...prev.gallery_images]
      const nextPreviews = [...prev.gallery_previews]
      nextImages.splice(index, 1)
      if (nextPreviews[index]) nextPreviews.splice(index, 1)
      return {
        ...prev,
        gallery_images: nextImages,
        gallery_previews: nextPreviews,
      }
    })
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploadingVideos(true)
      const uploaded: string[] = []
      for (const file of files) {
        const url = await uploadVideo(file)
        uploaded.push(url)
      }
      setForm((prev) => ({
        ...prev,
        video_urls: [...prev.video_urls, ...uploaded],
      }))
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки видео')
    } finally {
      setUploadingVideos(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  function removeVideo(url: string) {
    setForm((prev) => ({
      ...prev,
      video_urls: prev.video_urls.filter((item) => item !== url),
    }))
  }

  async function handleDocumentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploadingDocuments(true)
      const uploaded = [] as { url: string; name: string }[]
      for (const file of files) {
        const doc = await uploadDocument(file)
        uploaded.push(doc)
      }
      setForm((prev) => ({
        ...prev,
        document_files: [...prev.document_files, ...uploaded],
      }))
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Ошибка загрузки файлов')
    } finally {
      setUploadingDocuments(false)
      if (documentInputRef.current) documentInputRef.current.value = ''
    }
  }

  function removeDocument(url: string) {
    setForm((prev) => ({
      ...prev,
      document_files: prev.document_files.filter((item) => item.url !== url),
    }))
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить интерьер?')) return
    try {
      const { error } = await supabase.from('client_interiors').delete().eq('id', id)
      if (error) throw error
      await loadInteriors()
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Не удалось удалить интерьер')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('Введите название интерьера')
      return
    }
    if (!form.cover_image) {
      alert('Добавьте обложку интерьера')
      return
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      cover_image: form.cover_image,
      gallery_images: form.gallery_images.length ? form.gallery_images : null,
      gallery_previews: form.gallery_previews.length ? form.gallery_previews : null,
      video_urls: form.video_urls.length ? form.video_urls : null,
      document_files: form.document_files.length ? form.document_files : null,
      location: form.location.trim() || null,
      area: form.area.trim() || null,
      style: form.style.trim() || null,
      sort_order: form.sort_order.trim() ? Number(form.sort_order.trim()) : null,
    }

    try {
      setSaving(true)
      if (activeId) {
        const { error } = await supabase.from('client_interiors').update(payload).eq('id', activeId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('client_interiors').insert([payload])
        if (error) throw error
      }
      setShowModal(false)
      setForm(emptyForm)
      setActiveId(null)
      await loadInteriors()
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Не удалось сохранить интерьер')
    } finally {
      setSaving(false)
    }
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
  }

  const filteredInteriors = interiors.filter((interior) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      interior.title.toLowerCase().includes(query) ||
      interior.subtitle?.toLowerCase().includes(query) ||
      interior.description?.toLowerCase().includes(query) ||
      interior.location?.toLowerCase().includes(query) ||
      interior.style?.toLowerCase().includes(query)
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Интерьеры клиентов</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Управляйте галереей проектов для страницы партнёров
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Icons.Plus />
              <span>Добавить интерьер</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Всего интерьеров</div>
            <div className="text-3xl font-bold text-gray-900">{interiors.length}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С галереей</div>
            <div className="text-3xl font-bold text-blue-600">
              {interiors.filter(i => i.gallery_images && i.gallery_images.length > 0).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С видео</div>
            <div className="text-3xl font-bold text-green-600">
              {interiors.filter(i => i.video_urls && i.video_urls.length > 0).length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С документами</div>
            <div className="text-3xl font-bold text-purple-600">
              {interiors.filter(i => i.document_files && i.document_files.length > 0).length}
            </div>
          </div>
        </div>

        {/* Поиск */}
        {interiors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск интерьеров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
        )}

        {/* Сетка интерьеров */}
        {interiors.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-gray-600 text-lg font-medium mb-2">Интерьеры отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">Добавьте первый интерьер, чтобы он появился в галерее партнёров</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Icons.Plus />
              <span>Добавить первый интерьер</span>
            </button>
          </div>
        ) : filteredInteriors.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">Интерьеры не найдены</p>
            <p className="text-gray-500 text-sm mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInteriors.map((interior) => (
              <div
                key={interior.id}
                className="relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {interior.cover_image ? (
                    <Image
                      src={interior.cover_image}
                      alt={interior.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      unoptimized={interior.cover_image?.includes('unsplash.com') || false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      Обложка отсутствует
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-gray-700">
                    #{interior.id}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{interior.title}</h3>
                    {interior.subtitle && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">{interior.subtitle}</p>
                    )}
                    {interior.location && (
                      <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {interior.location}
                      </p>
                    )}
                    {(interior.area || interior.style) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {interior.area && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {interior.area}
                          </span>
                        )}
                        {interior.style && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {interior.style}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {interior.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{interior.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {interior.gallery_images?.length ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        {interior.gallery_images.length}
                      </span>
                    ) : null}
                    {interior.video_urls?.length ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {interior.video_urls.length}
                      </span>
                    ) : null}
                    {interior.document_files?.length ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        {interior.document_files.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(interior)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
                    >
                      <Icons.Edit />
                      <span>Редактировать</span>
                    </button>
                    <button
                      onClick={() => handleDelete(interior.id)}
                      className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all"
                      title="Удалить интерьер"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  {activeId ? 'Редактировать интерьер' : 'Добавить интерьер'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
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
                      Название проекта <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Кухня Лакони"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Подзаголовок / комментарий
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Апартаменты для молодой пары"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={5}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Расскажите историю проекта, используемые материалы и интересные решения."
                    />
                  </div>
                </div>
              </div>

              {/* Параметры проекта */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Параметры проекта
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Локация
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Москва, ЖК Ривер Парк"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Площадь / метрика
                    </label>
                    <input
                      type="text"
                      value={form.area}
                      onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="72 м²"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Стиль
                    </label>
                    <input
                      type="text"
                      value={form.style}
                      onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Современная классика"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Порядок сортировки
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Например, 10"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Чем меньше число, тем выше интерьер в списке
                    </p>
                  </div>
                </div>
              </div>

              {/* Обложка и галерея */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Изображения
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Обложка интерьера <span className="text-red-500">*</span>
                      </label>
                      {uploadingCover && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </span>
                      )}
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                      {form.cover_image ? (
                        <>
                          <Image
                            src={form.cover_image}
                            alt="Обложка интерьера"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            unoptimized={form.cover_image?.includes('unsplash.com') || false}
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <label className="inline-flex cursor-pointer items-center rounded-lg bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-white transition-colors">
                              <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverSelect}
                              />
                              {uploadingCover ? 'Загрузка...' : 'Заменить'}
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="flex h-full flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverSelect}
                          />
                          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-600">Загрузить обложку</span>
                          <span className="text-xs text-gray-500">Нажмите для выбора файла</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Галерея (доп. кадры)
                      </label>
                      {uploadingGallery && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {form.gallery_images.map((url, index) => (
                          <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white group">
                            <Image
                              src={form.gallery_previews[index] || url}
                              alt="Превью изображения"
                              fill
                              className="object-cover"
                              sizes="150px"
                              unoptimized={(form.gallery_previews[index] || url)?.includes('unsplash.com') || false}
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(url)}
                              className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Удалить изображение"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white text-center text-xs text-gray-500 transition hover:border-gray-400 hover:bg-gray-50">
                          <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleGallerySelect}
                          />
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span className="font-medium">Добавить</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Видео и документы */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Видео и документы
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Видео</label>
                      {uploadingVideos && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="space-y-2">
                        {form.video_urls.map((url) => (
                          <div key={url} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-700 flex-1 min-w-0">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                              <span className="truncate flex-1">{url.split('/').pop()}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideo(url)}
                              className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500 transition hover:border-gray-400 hover:bg-gray-50">
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm"
                            multiple
                            className="hidden"
                            onChange={handleVideoSelect}
                          />
                          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Добавить видео</span>
                          <span className="text-xs text-gray-400">MP4/WebM до 200 МБ</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Документы / PDF</label>
                      {uploadingDocuments && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="space-y-2">
                        {form.document_files.map((doc) => (
                          <div key={doc.url} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 transition-colors">
                            <span className="flex items-center gap-3 text-sm text-gray-700 flex-1 min-w-0">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </div>
                              <span className="truncate flex-1">{doc.name || doc.url.split('/').pop()}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDocument(doc.url)}
                              className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500 transition hover:border-gray-400 hover:bg-gray-50">
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            onChange={handleDocumentSelect}
                          />
                          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span className="font-medium">Прикрепить PDF</span>
                          <span className="text-xs text-gray-400">Презентации, планы</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Панель действий */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setForm(emptyForm)
                      setActiveId(null)
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    disabled={saving}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить интерьер'
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
