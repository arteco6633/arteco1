'use client'

import { useEffect, useState } from 'react'
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

      const orders = ordersData.data || []
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length

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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Дашборд</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка статистики...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Заказы */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">📦</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Всего заказов</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/crm/orders" className="font-medium text-blue-600 hover:text-blue-500">
                      Просмотреть все →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Ожидающие заказы */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">⏳</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Ожидающие заказы</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingOrders}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/crm/orders?status=pending" className="font-medium text-blue-600 hover:text-blue-500">
                      Просмотреть →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Выручка */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xl">💰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Общая выручка</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</dd>
                      </dl>
                    </div>
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
        </div>
      </main>
    </div>
  )
}

