'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Интерьеры клиентов</h1>
          <p className="text-sm text-gray-500">
            Управляйте галереей проектов для страницы партнёров. Добавляйте фотографии, описания и метрики.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900"
        >
          <span>Новый интерьер</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse h-[280px]" />
          ))}
        </div>
      ) : interiors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          Добавьте первый интерьер, чтобы он появился в галерее партнёров.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {interiors.map((interior) => (
            <div
              key={interior.id}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                {interior.cover_image ? (
                  <Image
                    src={interior.cover_image}
                    alt={interior.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized={interior.cover_image?.includes('unsplash.com') || false}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    Обложка отсутствует
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-gray-700">
                  ID #{interior.id}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{interior.title}</h3>
                  {interior.location && (
                    <p className="mt-1 text-sm text-gray-500">{interior.location}</p>
                  )}
                </div>
                {interior.description && (
                  <p className="text-sm text-gray-500 line-clamp-3">{interior.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  {interior.gallery_images?.length ? (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 7l3 9h12l3-9M9 12h.01M15 12h.01" />
                      </svg>
                      {interior.gallery_images.length}
                    </span>
                  ) : null}
                  {interior.video_urls?.length ? (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z" />
                      </svg>
                      {interior.video_urls.length}
                    </span>
                  ) : null}
                  {interior.document_files?.length ? (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10a4 4 0 004 4h6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4.5a2.5 2.5 0 012.5 2.5V21" />
                      </svg>
                      {interior.document_files.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(interior)}
                    className="text-sm font-medium text-black hover:text-gray-800"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(interior.id)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {activeId ? 'Редактирование интерьера' : 'Новый интерьер'}
                </h2>
                <p className="text-sm text-gray-500">Добавьте описание, фото и параметры квартиры.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-gray-200 bg-white p-2 text-gray-500 hover:text-gray-700"
                aria-label="Закрыть"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Название проекта</span>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Кухня Лакони"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Подзаголовок / комментарий</span>
                    <input
                      value={form.subtitle}
                      onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Апартаменты для молодой пары"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Локация</span>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Москва, ЖК Ривер Парк"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Площадь / метрика</span>
                    <input
                      value={form.area}
                      onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="72 м²"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Стиль</span>
                    <input
                      value={form.style}
                      onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Современная классика"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Порядок сортировки</span>
                    <input
                      value={form.sort_order}
                      onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Например, 10"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">Описание</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    className="rounded-lg border border-gray-200 px-3 py-2"
                    placeholder="Расскажите историю проекта, используемые материалы и интересные решения."
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_3fr]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Обложка интерьера</span>
                      {uploadingCover && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                      {form.cover_image ? (
                        <Image
                          src={form.cover_image}
                          alt="Обложка интерьера"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 40vw"
                          unoptimized={form.cover_image?.includes('unsplash.com') || false}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-400">
                          Загрузите визуализацию
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-3 flex justify-center">
                        <label className="inline-flex cursor-pointer items-center rounded-full bg-black px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white shadow hover:bg-gray-900">
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverSelect}
                          />
                          {uploadingCover ? 'Загрузка...' : form.cover_image ? 'Заменить' : 'Загрузить'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Галерея (доп. кадры)</span>
                      {uploadingGallery && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {form.gallery_images.map((url, index) => (
                          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white shadow"
                              aria-label="Удалить изображение"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-center text-xs text-gray-400 transition hover:border-gray-400">
                          <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleGallerySelect}
                          />
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>Добавить</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Видео</span>
                      {uploadingVideos && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="space-y-3">
                        {form.video_urls.map((url) => (
                          <div key={url} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z" />
                                </svg>
                              </div>
                              <span className="max-w-[180px] truncate">{url.split('/').pop()}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideo(url)}
                              className="text-sm text-red-500 hover:text-red-600"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-xs text-gray-400 transition hover:border-gray-400">
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm"
                            multiple
                            className="hidden"
                            onChange={handleVideoSelect}
                          />
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8v8a2 2 0 002 2h8l6 4V4l-6 4H6a2 2 0 00-2 2z" />
                          </svg>
                          <span>Добавить видео</span>
                          <span className="text-[10px] text-gray-400">MP4/WebM до 200 МБ — отображаются отдельным блоком</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Документы / PDF</span>
                      {uploadingDocuments && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="space-y-2">
                        {form.document_files.map((doc) => (
                          <div key={doc.url} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                            <span className="flex items-center gap-2 truncate">
                              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10a4 4 0 004 4h6" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4.5a2.5 2.5 0 012.5 2.5V21" />
                              </svg>
                              <span className="truncate max-w-[180px]">{doc.name || doc.url.split('/').pop()}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDocument(doc.url)}
                              className="text-sm text-red-500 hover:text-red-600"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-xs text-gray-400 transition hover:border-gray-400">
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            onChange={handleDocumentSelect}
                          />
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>Прикрепить PDF</span>
                          <span className="text-[10px] text-gray-400">Презентации, планы</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(emptyForm)
                    setActiveId(null)
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow hover:bg-gray-900 disabled:opacity-70"
                >
                  {saving ? 'Сохраняю...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
