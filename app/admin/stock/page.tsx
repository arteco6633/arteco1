'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  sku: string | null
  stock_quantity: number | null
  price: number
  image_url: string | null
  updated_at: string
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

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, price, image_url, updated_at')
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
    if (!confirm('Запустить синхронизацию остатков с Woodville? Это может занять некоторое время.')) {
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
        // Перезагружаем товары после успешной синхронизации
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

  // Фильтрация товаров
  const filteredProducts = products.filter((product) => {
    // Поиск по названию или артикулу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = product.name.toLowerCase().includes(query)
      const matchesSku = product.sku?.toLowerCase().includes(query) || false
      if (!matchesName && !matchesSku) return false
    }

    // Фильтры
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

  // Форматирование остатков
  function formatStock(quantity: number | null): string {
    if (quantity === null || quantity === 0) {
      return 'Нет в наличии'
    }
    if (quantity >= 9999) {
      return 'Много'
    }
    return quantity.toString()
  }

  // Получение цвета для остатков
  function getStockColor(quantity: number | null): string {
    if (quantity === null || quantity === 0) {
      return 'text-red-600'
    }
    if (quantity >= 9999) {
      return 'text-green-600'
    }
    if (quantity < 10) {
      return 'text-yellow-600'
    }
    return 'text-gray-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="admin-container">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl">Загрузка...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="text-3xl font-bold">Управление остатками</h1>
            <p className="text-gray-600 mt-1">
              Синхронизация остатков товаров с сайтом Woodville
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/products"
              className="btn btn-secondary"
            >
              ← К товарам
            </Link>
            <button
              onClick={handleSyncStock}
              disabled={syncing}
              className="btn btn-primary"
            >
              {syncing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Синхронизация...
                </>
              ) : (
                <>
                  🔄 Синхронизировать все
                </>
              )}
            </button>
          </div>
        </div>

        {/* Результат синхронизации */}
        {syncResult && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              syncResult.ok
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${syncResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                  {syncResult.ok ? '✓ Синхронизация завершена' : '✗ Ошибка синхронизации'}
                </h3>
                {syncResult.ok && (
                  <p className="text-sm text-green-700 mt-1">
                    Обновлено: {syncResult.synced || 0} из {syncResult.total || 0} товаров
                    {syncResult.errors && syncResult.errors > 0 && (
                      <span className="ml-2 text-yellow-700">
                        Ошибок: {syncResult.errors}
                      </span>
                    )}
                  </p>
                )}
                {!syncResult.ok && syncResult.message && (
                  <p className="text-sm text-red-700 mt-1">{syncResult.message}</p>
                )}
              </div>
              <button
                onClick={() => setSyncResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Информация об автоматической синхронизации */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⏰</div>
            <div>
              <h3 className="font-semibold text-blue-800">Автоматическая синхронизация</h3>
              <p className="text-sm text-blue-700 mt-1">
                Остатки автоматически синхронизируются каждый день в 2:00 UTC (5:00 МСК) через cron job.
                Для настройки перейдите в Vercel → Settings → Cron Jobs.
              </p>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'all'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('with-sku')}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'with-sku'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              С артикулом
            </button>
            <button
              onClick={() => setFilter('no-sku')}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'no-sku'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              Без артикула
            </button>
            <button
              onClick={() => setFilter('low-stock')}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'low-stock'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              Мало остатков
            </button>
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Изображение</th>
                <th>Название</th>
                <th>Артикул (SKU)</th>
                <th>Остаток</th>
                <th>Цена</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Товары не найдены' : 'Нет товаров для отображения'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-gray-100 grid place-items-center text-xs text-gray-400">
                          нет фото
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-medium">{product.name}</span>
                    </td>
                    <td>
                      {product.sku ? (
                        <span className="font-mono text-sm">{product.sku}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`font-semibold ${getStockColor(product.stock_quantity)}`}>
                        {formatStock(product.stock_quantity)}
                      </span>
                    </td>
                    <td>{product.price} ₽</td>
                    <td className="text-sm text-gray-600">
                      {product.updated_at
                        ? new Date(product.updated_at).toLocaleString('ru-RU')
                        : '—'}
                    </td>
                    <td>
                      {product.sku ? (
                        <button
                          onClick={() => handleSyncProduct(product.id)}
                          disabled={syncing}
                          className="btn btn-secondary btn-sm"
                          title="Синхронизировать этот товар"
                        >
                          {syncing ? '...' : '🔄'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Нет артикула</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Статистика */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Всего товаров</div>
            <div className="text-2xl font-bold mt-1">{products.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">С артикулом</div>
            <div className="text-2xl font-bold mt-1">
              {products.filter((p) => p.sku).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">В наличии</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {products.filter((p) => (p.stock_quantity || 0) > 0).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Мало остатков</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {products.filter((p) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

