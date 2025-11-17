'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product { id: number; name: string }
interface ModuleItem {
  id: number
  product_id: number
  name: string
  sku: string | null
  description: string | null
  image_url: string | null
  price: number
  width: number | null
  height: number | null
  depth: number | null
  kind: string | null
}

export default function AdminModulesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [items, setItems] = useState<ModuleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<ModuleItem>>({ price: 0 })
  const [showModal, setShowModal] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sourceProduct, setSourceProduct] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (selectedProduct) loadModules(selectedProduct) }, [selectedProduct])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('id, name').order('name', { ascending: true })
    setProducts(data || [])
    setLoading(false)
  }

  async function loadModules(productId: number) {
    setLoading(true)
    const { data } = await supabase
      .from('product_modules')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true })
    setItems((data as any) || [])
    setLoading(false)
  }

  async function copyFromProduct() {
    if (!selectedProduct || !sourceProduct) return
    if (selectedProduct === sourceProduct) {
      alert('Нельзя копировать модули внутри одного и того же товара')
      return
    }
    try {
      setSaving(true)
      const { data: src } = await supabase
        .from('product_modules')
        .select('name, sku, description, image_url, price, width, height, depth, kind, position')
        .eq('product_id', sourceProduct as number)
        .order('position', { ascending: true })
      const rows = (src || []).map((r: any) => ({ ...r, product_id: selectedProduct }))
      if (rows.length === 0) {
        alert('У выбранного источника нет модулей')
        setSaving(false)
        return
      }
      const { error } = await supabase.from('product_modules').insert(rows)
      if (error) throw error
      await loadModules(selectedProduct)
      alert(`Скопировано модулей: ${rows.length}`)
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Ошибка копирования модулей')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setSaving(true)
    const payload: any = {
      product_id: selectedProduct,
      name: form.name?.trim() || 'Модуль',
      sku: form.sku || null,
      description: form.description || null,
      image_url: form.image_url || null,
      price: Number(form.price || 0),
      width: form.width ? Number(form.width) : null,
      height: form.height ? Number(form.height) : null,
      depth: form.depth ? Number(form.depth) : null,
      kind: form.kind || null,
    }
    if ((form as any).id) {
      await supabase.from('product_modules').update(payload).eq('id', (form as any).id)
    } else {
      await supabase.from('product_modules').insert([payload])
    }
    setSaving(false)
    setShowModal(false)
    setForm({ price: 0 })
    loadModules(selectedProduct)
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `modules/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('product')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('product').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const url = await uploadImage(file)
      setForm((prev) => ({ ...prev, image_url: url }))
    } catch (err: any) {
      alert(err?.message || 'Ошибка загрузки изображения')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить модуль?')) return
    await supabase.from('product_modules').delete().eq('id', id)
    if (selectedProduct) loadModules(selectedProduct)
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
    Copy: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.kind?.toLowerCase().includes(query)
    )
  })

  if (loading && products.length === 0) {
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
              <h1 className="text-2xl font-bold text-gray-900">Модули кухонь</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={!selectedProduct}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Plus />
              <span>Добавить модуль</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Выбор товара */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите товар (кухню)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Товар <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full sm:w-96 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                value={selectedProduct ?? ''}
                onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Выберите товар —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {selectedProduct && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Импортировать модули из:</span>
                  <select
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    value={sourceProduct}
                    onChange={(e) => setSourceProduct(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedProduct}
                  >
                    <option value="">— Не выбрано —</option>
                    {products.filter(p => p.id !== selectedProduct).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={copyFromProduct}
                  disabled={!selectedProduct || !sourceProduct || saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <Icons.Copy />
                  <span>Скопировать модули</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Статистика */}
        {selectedProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Всего модулей</div>
              <div className="text-3xl font-bold text-gray-900">{items.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">С SKU</div>
              <div className="text-3xl font-bold text-blue-600">
                {items.filter(m => m.sku).length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">С изображением</div>
              <div className="text-3xl font-bold text-green-600">
                {items.filter(m => m.image_url).length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Средняя цена</div>
              <div className="text-3xl font-bold text-purple-600">
                {items.length > 0
                  ? Math.round(items.reduce((sum, m) => sum + Number(m.price), 0) / items.length).toLocaleString('ru-RU')
                  : '0'} ₽
              </div>
            </div>
          </div>
        )}

        {/* Таблица модулей */}
        {selectedProduct && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Список модулей</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Поиск модулей..."
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
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Модуль</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">SKU</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Цена</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">Размеры</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Тип</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-500">#{m.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {m.image_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={m.image_url}
                                alt={m.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{m.name}</div>
                            {m.description && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">{m.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{m.sku || <span className="text-gray-400">—</span>}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {Number(m.price).toLocaleString('ru-RU')} ₽
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {m.width || '—'} × {m.height || '—'} × {m.depth || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {m.kind === 'base' ? 'Напольный' :
                           m.kind === 'wall' ? 'Навесной' :
                           m.kind === 'tall' ? 'Высокий' :
                           m.kind === 'corner' ? 'Угловой' : m.kind || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setForm(m); setShowModal(true) }}
                            className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
                            title="Редактировать модуль"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
                            title="Удалить модуль"
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
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">
                  {searchQuery ? 'Модули не найдены' : items.length === 0 ? 'Модули не добавлены' : 'Нет результатов поиска'}
                </p>
                {!searchQuery && items.length === 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Icons.Plus />
                    <span>Добавить первый модуль</span>
                  </button>
                )}
              </div>
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
                  {(form as any).id ? 'Редактировать модуль' : 'Добавить модуль'}
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
            <form onSubmit={handleSave} className="space-y-8">
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
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Введите название модуля"
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
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Введите описание модуля (необязательно)"
                    />
                  </div>
                </div>
              </div>

              {/* Цена и SKU */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Цена и артикул
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цена, ₽
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.price ?? 0}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU (артикул)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.sku || ''}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="Введите SKU (необязательно)"
                    />
                  </div>
                </div>
              </div>

              {/* Изображение модуля */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Изображение модуля
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Загрузить изображение
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {uploadingImage ? 'Загрузка…' : 'Выбрать файл'}
                        </span>
                      </label>
                      {uploadingImage && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </div>
                      )}
                    </div>
                  </div>

                  {form.image_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Превью изображения
                      </label>
                      <div className="relative inline-block">
                        <img
                          src={form.image_url}
                          alt="Превью модуля"
                          className="max-w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: '' })}
                          className="absolute top-2 right-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Размеры и тип */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Размеры и тип модуля
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ширина (мм)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.width || ''}
                      onChange={(e) => setForm({ ...form, width: e.target.value ? Number(e.target.value) : null })}
                      placeholder="—"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Высота (мм)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.height || ''}
                      onChange={(e) => setForm({ ...form, height: e.target.value ? Number(e.target.value) : null })}
                      placeholder="—"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Глубина (мм)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.depth || ''}
                      onChange={(e) => setForm({ ...form, depth: e.target.value ? Number(e.target.value) : null })}
                      placeholder="—"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип модуля
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      value={form.kind || ''}
                      onChange={(e) => setForm({ ...form, kind: e.target.value || null })}
                    >
                      <option value="">— Не указано —</option>
                      <option value="base">Напольный</option>
                      <option value="wall">Навесной</option>
                      <option value="tall">Высокий</option>
                      <option value="corner">Угловой</option>
                    </select>
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
                    disabled={saving}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={saving}
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
                      'Сохранить модуль'
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


