'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export default function CRMDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalPartners: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)

      // Загружаем статистику из Supabase
      const [ordersData, usersData, partnersData, clientsData] = await Promise.all([
        supabaseServer.from('orders').select('id, total_amount, status'),
        supabaseServer.from('users_local').select('id'),
        supabaseServer.from('partners').select('id'),
        supabaseServer.from('partner_clients').select('id')
      ])

      const ord = ordersData.data || []
      setOrders(ord)
      const totalRevenue = ord.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0)
      const pendingOrders = ord.filter((o: any) => o.status === 'pending' || o.status === 'processing' || o.status === 'new').length

      setStats({
        totalOrders: orders.length,
        totalUsers: usersData.data?.length || 0,
        totalPartners: partnersData.data?.length || 0,
        totalClients: clientsData.data?.length || 0,
        totalRevenue,
        pendingOrders
      })
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  // Воронка по статусам
  const funnel = useMemo(() => {
    const map: Record<string, number> = { new: 0, processing: 0, pending: 0, delivered: 0, completed: 0, cancelled: 0 }
    orders.forEach(o => { map[o.status || 'new'] = (map[o.status || 'new'] || 0) + 1 })
    return map
  }, [orders])

  // Последние 10 заказов (новые)
  const recent = useMemo(() => {
    return [...orders].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,10)
  }, [orders])

  // Доход по дням за 7 дней (sparkline)
  const revenue7 = useMemo(() => {
    const days: Record<string, number> = {}
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i)
      const key = d.toISOString().slice(0,10)
      days[key] = 0
    }
    orders.forEach(o => {
      const key = (o.created_at||'').slice(0,10)
      if (key in days) days[key] += Number(o.total_amount || 0)
    })
    const labels = Object.keys(days)
    const values = Object.values(days)
    const max = Math.max(1, ...values)
    const points = values.map((v, i) => {
      const x = (i/(values.length-1))*100
      const y = 100 - (v/max)*100
      return `${x},${y}`
    }).join(' ')
    return { labels, values, max, points }
  }, [orders])

  return (
    <div className="min-h-screen">
      {/* Навигация */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">ARTECO CRM</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/crm" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Дашборд
                </Link>
                <Link href="/crm/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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

      {/* Основной контент */}
      <main className="max-w-[1400px] mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-3 sm:px-0 py-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-6 sm:mb-8">Дашборд</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка статистики...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Заказы */}
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition rounded-2xl">
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 inline-grid place-items-center w-12 h-12 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                      {/* box icon */}
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Всего заказов</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50/80 px-5 py-3">
                  <Link href="/crm/orders" className="text-sm text-blue-600 hover:text-blue-500">Просмотреть все →</Link>
                </div>
              </div>

              {/* Ожидающие заказы */}
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition rounded-2xl">
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 inline-grid place-items-center w-12 h-12 rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      {/* hourglass */}
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12"/><path d="M6 22h12"/><path d="M18 2v6a6 6 0 0 1-6 6 6 6 0 0 1-6-6V2"/><path d="M6 22v-6a6 6 0 0 1 6-6 6 6 0 0 1 6 6v6"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Ожидающие заказы</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50/80 px-5 py-3">
                  <Link href="/crm/orders?status=pending" className="text-sm text-blue-600 hover:text-blue-500">Просмотреть →</Link>
                </div>
              </div>

              {/* Выручка */}
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition rounded-2xl">
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 inline-grid place-items-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      {/* cash */}
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v0"/><path d="M18 14v0"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Общая выручка</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
                    </div>
                  </div>
                  {/* Мини‑график */}
                  <div className="mt-4 bg-gray-50 rounded-md p-3">
                    <svg viewBox="0 0 100 100" className="w-full h-16">
                      <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={revenue7.points} />
                    </svg>
                    <div className="mt-2 text-xs text-gray-500">Выручка за 7 дней</div>
                  </div>
                </div>
              </div>

              {/* Пользователи */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Пользователи</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/crm/users" className="font-medium text-blue-600 hover:text-blue-500">
                      Просмотреть всех →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Партнеры */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">🤝</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Партнеры</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalPartners}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/crm/partners" className="font-medium text-blue-600 hover:text-blue-500">
                      Просмотреть всех →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Клиенты партнеров */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-pink-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">📋</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Клиенты партнеров</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalClients}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/crm/clients" className="font-medium text-blue-600 hover:text-blue-500">
                      Просмотреть всех →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Воронка по статусам и Новые заявки */}
          {!loading && (
            <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Новые заявки</div>
                  <Link href="/crm/orders" className="text-sm text-blue-600 hover:text-blue-500">Все заказы →</Link>
                </div>
                {recent.length === 0 ? (
                  <div className="text-sm text-gray-500">Пока нет заказов</div>
                ) : (
                  <div className="divide-y">
                    {recent.map(o => (
                      <Link key={o.id} href={`/crm/orders/${o.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">#{o.order_number || o.id} — {o.user_name || o.contact?.name || 'Без имени'}</div>
                          <div className="text-xs text-gray-500 truncate">{new Date(o.created_at).toLocaleString('ru-RU')}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold">{Number(o.total_amount||0).toLocaleString('ru-RU')} ₽</div>
                          <div className="text-xs text-gray-500 capitalize">{o.status || 'new'}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <div className="text-lg font-semibold mb-4">Воронка статусов</div>
                <div className="space-y-2 text-sm">
                  {([
                    ['new','Новые'],
                    ['processing','В работе'],
                    ['pending','Ожидают'],
                    ['delivered','Доставлены'],
                    ['completed','Завершены'],
                    ['cancelled','Отменены'],
                  ] as Array<[keyof typeof funnel, string]>).map(([k, label]) => (
                    <div key={k} className="flex items-center justify-between">
                      <div className="text-gray-600">{label}</div>
                      <div className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-gray-100 text-gray-800 font-semibold">{funnel[k] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


