'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  sku: string | null
  stock_quantity: number | null
  price: number
  cost_price: number | null // Себестоимость (цена поставщика)
  image_url: string | null
  updated_at: string
}

// Минималистичные SVG иконки
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Sync: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Clock: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Loading: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    ok: boolean
    total?: number
    synced?: number
    errors?: number
    message?: string
  } | null>(null)
  const [filter, setFilter] = useState<'all' | 'with-sku' | 'no-sku' | 'low-stock'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCostPriceId, setEditingCostPriceId] = useState<number | null>(null)
  const [costPriceInput, setCostPriceInput] = useState<string>('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, price, cost_price, image_url, updated_at')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
      alert('Ошибка при загрузке товаров')
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncStock() {
    if (!confirm('Запустить синхронизацию остатков и цен с Woodville? Это может занять некоторое время.')) {
      return
    }

    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/admin/sync-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()
      setSyncResult(result)

      if (result.ok) {
        await loadProducts()
      }
    } catch (error: any) {
      console.error('Ошибка синхронизации:', error)
      setSyncResult({
        ok: false,
        message: error.message || 'Ошибка при синхронизации',
      })
    } finally {
      setSyncing(false)
    }
  }

  async function handleSyncProduct(productId: number) {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/admin/sync-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: [productId] }),
      })

      const result = await response.json()
      setSyncResult(result)

      if (result.ok) {
        await loadProducts()
      }
    } catch (error: any) {
      console.error('Ошибка синхронизации:', error)
      setSyncResult({
        ok: false,
        message: error.message || 'Ошибка при синхронизации',
      })
    } finally {
      setSyncing(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = product.name.toLowerCase().includes(query)
      const matchesSku = product.sku?.toLowerCase().includes(query) || false
      if (!matchesName && !matchesSku) return false
    }

    switch (filter) {
      case 'with-sku':
        return !!product.sku
      case 'no-sku':
        return !product.sku
      case 'low-stock':
        return (product.stock_quantity || 0) < 10 && (product.stock_quantity || 0) > 0
      default:
        return true
    }
  })

  function formatStock(quantity: number | null): string {
    if (quantity === null || quantity === 0) {
      return 'Нет в наличии'
    }
    if (quantity >= 9999) {
      return 'Много'
    }
    return quantity.toString()
  }

  function getStockColor(quantity: number | null): string {
    if (quantity === null || quantity === 0) {
      return 'text-red-600 bg-red-50'
    }
    if (quantity >= 9999) {
      return 'text-green-600 bg-green-50'
    }
    if (quantity < 10) {
      return 'text-yellow-600 bg-yellow-50'
    }
    return 'text-blue-600 bg-blue-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.Loading />
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: products.length,
    withSku: products.filter((p) => p.sku).length,
    inStock: products.filter((p) => (p.stock_quantity || 0) > 0).length,
    lowStock: products.filter((p) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length,
    withCostPrice: products.filter((p) => p.cost_price !== null && p.cost_price !== undefined).length,
    avgMargin: (() => {
      const productsWithCost = products.filter((p) => p.cost_price !== null && p.cost_price !== undefined && p.cost_price > 0)
      if (productsWithCost.length === 0) return 0
      const totalMargin = productsWithCost.reduce((sum, p) => {
        const margin = p.price - (p.cost_price || 0)
        return sum + margin
      }, 0)
      return Math.round(totalMargin / productsWithCost.length)
    })(),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Хедер */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Icons.ArrowLeft />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Управление остатками</h1>
                <p className="text-sm text-gray-600">Синхронизация остатков и цен товаров с Woodville</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>К товарам</span>
              </Link>
              <button
                onClick={handleSyncStock}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {syncing ? (
                  <>
                    <Icons.Loading />
                    <span>Синхронизация...</span>
                  </>
                ) : (
                  <>
                    <Icons.Sync />
                    <span>Синхронизировать все</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="w-full px-2 sm:px-3 lg:px-4 py-8">
        {/* Результат синхронизации */}
        {syncResult && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              syncResult.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {syncResult.ok ? (
                  <Icons.CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <Icons.XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${syncResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                    {syncResult.ok ? 'Синхронизация завершена' : 'Ошибка синхронизации'}
                  </h3>
                  {syncResult.ok && (
                    <p className="text-sm text-green-700 mt-1">
                      Обновлено: {syncResult.synced || 0} из {syncResult.total || 0} товаров
                      {syncResult.errors && syncResult.errors > 0 && (
                        <span className="ml-2 text-yellow-700">Ошибок: {syncResult.errors}</span>
                      )}
                    </p>
                  )}
                  {!syncResult.ok && syncResult.message && (
                    <p className="text-sm text-red-700 mt-1">{syncResult.message}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSyncResult(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icons.Close />
              </button>
            </div>
          </div>
        )}

        {/* Информация об автоматической синхронизации */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Icons.Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800">Автоматическая синхронизация</h3>
              <p className="text-sm text-blue-700 mt-1">
                Остатки автоматически синхронизируются каждый день в 2:00 UTC (5:00 МСК) через cron job.
                Для настройки перейдите в Vercel → Settings → Cron Jobs.
              </p>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С артикулом</div>
            <div className="text-3xl font-bold text-gray-900">{stats.withSku}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">В наличии</div>
            <div className="text-3xl font-bold text-green-600">{stats.inStock}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Мало остатков</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.lowStock}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">С себестоимостью</div>
            <div className="text-3xl font-bold text-blue-600">{stats.withCostPrice}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Средняя маржа</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.avgMargin > 0 ? `+${stats.avgMargin.toLocaleString('ru-RU')}` : stats.avgMargin.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'with-sku', 'no-sku', 'low-stock'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f === 'all' && 'Все'}
                {f === 'with-sku' && 'С артикулом'}
                {f === 'no-sku' && 'Без артикула'}
                {f === 'low-stock' && 'Мало остатков'}
              </button>
            ))}
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Фото</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Название</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Остаток</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Цена</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Себест.</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Маржа</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Обновлено</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'Товары не найдены' : 'Нет товаров для отображения'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isEditing = editingCostPriceId === product.id
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">{product.id}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-100 grid place-items-center text-[10px] text-gray-400">
                              нет
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 truncate" title={product.name}>
                          {product.name}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          {product.sku ? (
                            <span className="font-mono text-gray-700">{product.sku}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStockColor(product.stock_quantity)}`}>
                            {formatStock(product.stock_quantity)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={costPriceInput}
                                onChange={(e) => setCostPriceInput(e.target.value)}
                                onBlur={async () => {
                                  const newCost = costPriceInput ? parseFloat(costPriceInput) : null
                                  if (newCost !== null && !isNaN(newCost) && newCost >= 0) {
                                    try {
                                      const { error } = await supabase
                                        .from('products')
                                        .update({ cost_price: newCost })
                                        .eq('id', product.id)
                                      if (error) throw error
                                      await loadProducts()
                                    } catch (error) {
                                      console.error('Ошибка обновления себестоимости:', error)
                                      alert('Ошибка при сохранении себестоимости')
                                    }
                                  }
                                  setEditingCostPriceId(null)
                                  setCostPriceInput('')
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur()
                                  } else if (e.key === 'Escape') {
                                    setEditingCostPriceId(null)
                                    setCostPriceInput('')
                                  }
                                }}
                                className="w-20 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded group"
                              onClick={() => {
                                setEditingCostPriceId(product.id)
                                setCostPriceInput(product.cost_price ? product.cost_price.toString() : '')
                              }}
                              title="Нажмите, чтобы редактировать себестоимость"
                            >
                              {product.cost_price ? (
                                <span className="text-gray-700">{product.cost_price.toLocaleString('ru-RU')} ₽</span>
                              ) : (
                                <span className="text-gray-400 group-hover:text-gray-600">—</span>
                              )}
                              <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          {product.cost_price ? (() => {
                            const margin = product.price - product.cost_price
                            const marginPercent = ((margin / product.cost_price) * 100).toFixed(1)
                            const isPositive = margin >= 0
                            return (
                              <div className="flex flex-col">
                                <span className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {isPositive ? '+' : ''}{margin.toLocaleString('ru-RU')} ₽
                                </span>
                                <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                  {isPositive ? '+' : ''}{marginPercent}%
                                </span>
                              </div>
                            )
                          })() : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-[10px] text-gray-600">
                          {product.updated_at
                            ? new Date(product.updated_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          {product.sku ? (
                            <button
                              onClick={() => handleSyncProduct(product.id)}
                              disabled={syncing}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Синхронизировать этот товар"
                            >
                              {syncing ? <Icons.Loading /> : <Icons.Sync />}
                              <span>Синхр.</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400">Нет SKU</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
