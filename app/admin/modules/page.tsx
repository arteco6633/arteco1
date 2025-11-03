'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  async function handleDelete(id: number) {
    if (!confirm('Удалить модуль?')) return
    await supabase.from('product_modules').delete().eq('id', id)
    if (selectedProduct) loadModules(selectedProduct)
  }

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Модули кухонь</h1>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedProduct}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
        >
          Добавить модуль
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Товар (кухня)</label>
        <select
          className="w-full sm:w-96 border rounded-lg px-3 py-2"
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
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Название</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Цена</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Размеры</th>
                <th className="px-4 py-3 text-left text-sm text-gray-500">Тип</th>
                <th className="px-4 py-3 text-right text-sm text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{m.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{m.sku || '-'}</td>
                  <td className="px-4 py-3 text-sm">{Number(m.price).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3 text-sm">{m.width || '-'} × {m.height || '-'} × {m.depth || '-'}</td>
                  <td className="px-4 py-3 text-sm">{m.kind || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button onClick={() => { setForm(m); setShowModal(true) }} className="text-blue-600 mr-4">Редактировать</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600">Удалить</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Модули не добавлены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{(form as any).id ? 'Редактировать' : 'Добавить'} модуль</h2>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Название</label>
                <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Цена, ₽</label>
                <input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">URL изображения</label>
                <input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ширина</label>
                <input type="number" value={form.width || ''} onChange={(e) => setForm({ ...form, width: e.target.value ? Number(e.target.value) : null })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота</label>
                <input type="number" value={form.height || ''} onChange={(e) => setForm({ ...form, height: e.target.value ? Number(e.target.value) : null })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Глубина</label>
                <input type="number" value={form.depth || ''} onChange={(e) => setForm({ ...form, depth: e.target.value ? Number(e.target.value) : null })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Тип</label>
                <select value={form.kind || ''} onChange={(e) => setForm({ ...form, kind: e.target.value || null })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">—</option>
                  <option value="base">Напольный</option>
                  <option value="wall">Навесной</option>
                  <option value="tall">Высокий</option>
                  <option value="corner">Угловой</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Отмена</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}


