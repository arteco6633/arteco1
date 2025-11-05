'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

interface Order {
  id: number
  order_number?: string
  user_name?: string | null
  user_phone?: string | null
  total_amount?: number
  total?: number
  status: string
  payment_method?: string | null
  delivery_type?: string | null
  contact?: any // JSONB
  delivery?: any // JSONB
  payment?: any // JSONB
  created_at: string
}

export default function CRMOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      let query = supabaseServer
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Ошибка загрузки заказов:', error)
        return
      }

      // Преобразуем данные из JSONB полей в удобный формат
      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `#${order.id}`,
        user_name: order.user_name || order.contact?.name || order.contact?.user_name || null,
        user_phone: order.user_phone || order.contact?.phone || order.contact?.user_phone || null,
        total_amount: order.total_amount || order.total || 0,
        status: order.status || 'pending',
        payment_method: order.payment_method || order.payment?.method || null,
        delivery_type: order.delivery_type || order.delivery?.type || null,
        contact: order.contact,
        delivery: order.delivery,
        payment: order.payment,
        created_at: order.created_at
      }))

      setOrders(formattedOrders)
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusText(status: string) {
    const texts: Record<string, string> = {
      new: 'Новый',
      pending: 'Ожидает',
      processing: 'В обработке',
      delivered: 'Доставлен',
      completed: 'Завершен',
      cancelled: 'Отменен'
    }
    return texts[status] || status
  }

  const columns = useMemo(() => (
    [
      { key: 'new', title: 'Новые заявки' },
      { key: 'processing', title: 'В работе' },
      { key: 'pending', title: 'Ожидают' },
      { key: 'delivered', title: 'Доставлены' },
      { key: 'completed', title: 'Завершены' },
      { key: 'cancelled', title: 'Отменены' },
    ] as Array<{ key: string; title: string }>
  ), [])

  const grouped = useMemo(() => {
    const map: Record<string, Order[]> = {}
    columns.forEach(c => { map[c.key] = [] })
    orders.forEach(o => {
      const k = (o.status || 'new') as string
      if (!map[k]) map[k] = []
      map[k].push(o)
    })
    return map
  }, [orders, columns])

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, status: string) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain'))
    if (!id) return
    try {
      // сразу оптимистично меняем в UI
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
      const { error } = await supabaseServer.from('orders').update({ status }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Не удалось изменить статус', err)
      // перезагрузим для консистентности
      loadOrders()
    }
  }

  function allowDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function OrderCard({ order }: { order: Order }) {
    return (
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(order.id))}
        className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">#{order.order_number}</div>
          <div className={`px-2 py-0.5 rounded-full text-[11px] ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</div>
        </div>
        <div className="mt-1 text-sm text-gray-900 truncate">{order.user_name || 'Без имени'}</div>
        <div className="text-xs text-gray-500">{order.user_phone}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm font-semibold">{(order.total_amount || order.total || 0).toLocaleString('ru-RU')} ₽</div>
          <Link className="text-xs text-blue-600 hover:text-blue-500" href={`/crm/orders/${order.id}`}>Открыть →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/crm" className="text-2xl font-bold text-gray-900">ARTECO CRM</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/crm" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Дашборд
                </Link>
                <Link href="/crm/orders" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Заказы
                </Link>
                <Link href="/crm/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Пользователи
                </Link>
                <Link href="/crm/partners" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Партнеры
                </Link>
                <Link href="/crm/clients" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Клиенты партнеров
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Заказы</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-sm rounded-full border ${viewMode==='kanban' ? 'bg-black text-white border-black' : 'bg-white'}`}>Канбан</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm rounded-full border ${viewMode==='list' ? 'bg-black text-white border-black' : 'bg-white'}`}>Список</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка заказов...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Заказов не найдено</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id} className="px-4 py-4 sm:px-6">
                    <OrderCard order={order} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {columns.map(col => (
                <div key={col.key} className="bg-gray-50 border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">{col.title}</div>
                    <div className="text-xs text-gray-500">{grouped[col.key]?.length || 0}</div>
                  </div>
                  <div onDrop={(e)=>handleDrop(e, col.key)} onDragOver={allowDrop} className="min-h-[120px] space-y-3">
                    {(grouped[col.key] || []).map(o => (
                      <OrderCard key={o.id} order={o} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

