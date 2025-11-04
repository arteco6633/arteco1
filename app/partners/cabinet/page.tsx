'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PartnerStats {
  totalClients: number
  totalOrders: number
  totalRevenue: number
  totalCommissions: number
  pendingCommissions: number
}

interface Order {
  id: number
  client_name: string
  client_phone: string
  total_amount: number
  commission: number
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled'
  created_at: string
  items: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

interface Commission {
  id: number
  order_id: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  created_at: string
}

export default function PartnerCabinet() {
  const router = useRouter()
  const [partner, setPartner] = useState<{ id: number; phone: string; name: string | null; partner_type: string } | null>(null)
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'commissions' | 'stats'>('orders')

  useEffect(() => {
    // Проверяем наличие партнера в sessionStorage
    if (typeof window !== 'undefined') {
      const partnerData = sessionStorage.getItem('partner')
      if (partnerData) {
        try {
          const parsed = JSON.parse(partnerData)
          setPartner(parsed)
          loadPartnerData(parsed.id)
        } catch (err) {
          console.error('Ошибка парсинга данных партнера:', err)
          router.push('/partners/login')
        }
      } else {
        router.push('/partners/login')
      }
    }
  }, [router])

  async function loadPartnerData(partnerId: number) {
    try {
      setLoading(true)
      
      // Загрузка статистики из Supabase
      const { data: ordersData } = await supabase
        .from('partner_orders')
        .select('*')
        .eq('partner_id', partnerId)

      if (ordersData && ordersData.length > 0) {
        const totalClients = new Set(ordersData.map(o => o.client_phone)).size
        const totalOrders = ordersData.length
        const totalRevenue = ordersData.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
        const totalCommissions = ordersData.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0)
        
        const { data: pendingCommissionsData } = await supabase
          .from('partner_commissions')
          .select('amount')
          .eq('partner_id', partnerId)
          .eq('status', 'pending')

        const pendingCommissions = pendingCommissionsData?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0

        setStats({
          totalClients,
          totalOrders,
          totalRevenue,
          totalCommissions,
          pendingCommissions
        })

        // Загрузка заказов
        const formattedOrders = ordersData.map(order => ({
          id: order.id,
          client_name: order.client_name || '',
          client_phone: order.client_phone || '',
          total_amount: Number(order.total_amount || 0),
          commission: Number(order.commission_amount || 0),
          status: order.status as any,
          created_at: order.created_at,
          items: [] // Можно загрузить из orders через order_id
        }))
        setOrders(formattedOrders)

        // Загрузка комиссий
        const { data: commissionsData } = await supabase
          .from('partner_commissions')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false })

        if (commissionsData) {
          const formattedCommissions = commissionsData.map(commission => ({
            id: commission.id,
            order_id: commission.partner_order_id,
            amount: Number(commission.amount || 0),
            status: commission.status as any,
            paid_at: commission.paid_at,
            created_at: commission.created_at
          }))
          setCommissions(formattedCommissions)
        }
      } else {
        // Если нет данных, используем пустые значения
        setStats({
          totalClients: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          pendingCommissions: 0
        })
        setOrders([])
        setCommissions([])
      }
    } catch (error) {
      console.error('Ошибка загрузки данных партнера:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusText(status: string) {
    const texts: Record<string, string> = {
      pending: 'Ожидает',
      processing: 'В обработке',
      delivered: 'Доставлен',
      completed: 'Завершен',
      cancelled: 'Отменен',
      paid: 'Выплачено'
    }
    return texts[status] || status
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8 md:py-12">
        {/* Хлебные крошки */}
        <nav className="flex mb-6 md:mb-8 text-xs sm:text-sm text-gray-500 flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          <span>/</span>
          <Link href="/partners" className="hover:text-gray-700">Партнерам</Link>
          <span>/</span>
          <span className="text-gray-900">Личный кабинет</span>
        </nav>

        {/* Заголовок */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Личный кабинет партнера</h1>
          <p className="text-gray-600">Управляйте своими клиентами и отслеживайте комиссии</p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="text-sm md:text-base text-gray-600 mb-2">Клиентов</div>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalClients}</div>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="text-sm md:text-base text-gray-600 mb-2">Заказов</div>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalOrders}</div>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="text-sm md:text-base text-gray-600 mb-2">Объем продаж</div>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="text-sm md:text-base text-gray-600 mb-2">Всего комиссий</div>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalCommissions.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-2 border-yellow-400">
              <div className="text-sm md:text-base text-gray-600 mb-2">К выплате</div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pendingCommissions.toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
        )}

        {/* Вкладки */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Заказы
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'commissions'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Выплаты
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Статистика
            </button>
          </div>

          {/* Контент вкладок */}
          <div className="p-4 md:p-6">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Заказы ваших клиентов</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Нет заказов
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <div>
                            <div className="font-semibold text-lg mb-1">{order.client_name}</div>
                            <div className="text-gray-600 text-sm">{order.client_phone}</div>
                            <div className="text-gray-500 text-xs mt-1">{formatDate(order.created_at)}</div>
                          </div>
                          <div className="flex flex-col md:items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <div className="text-right">
                              <div className="text-gray-600 text-sm">Сумма заказа</div>
                              <div className="text-xl font-bold">{order.total_amount.toLocaleString('ru-RU')} ₽</div>
                              <div className="text-green-600 text-sm mt-1">Комиссия: {order.commission.toLocaleString('ru-RU')} ₽</div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <div className="text-sm font-semibold mb-2">Товары:</div>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.product_name} × {item.quantity}</span>
                                <span className="font-medium">{item.price.toLocaleString('ru-RU')} ₽</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commissions' && (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold mb-4">История выплат комиссий</h2>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Нет выплат
                  </div>
                ) : (
                  <div className="space-y-4">
                    {commissions.map((commission) => (
                      <div key={commission.id} className="border rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="font-semibold mb-1">Заказ №{commission.order_id}</div>
                            <div className="text-gray-500 text-sm">
                              {commission.paid_at ? `Выплачено: ${formatDate(commission.paid_at)}` : `Создано: ${formatDate(commission.created_at)}`}
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(commission.status)}`}>
                              {getStatusText(commission.status)}
                            </span>
                            <div className="text-2xl font-bold">{commission.amount.toLocaleString('ru-RU')} ₽</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Детальная статистика</h2>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-lg mb-4">За этот месяц</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Клиентов</span>
                          <span className="font-semibold">8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Заказов</span>
                          <span className="font-semibold">15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Объем продаж</span>
                          <span className="font-semibold">1 245 000 ₽</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Комиссии</span>
                          <span className="font-semibold text-green-600">124 500 ₽</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-lg mb-4">За все время</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Клиентов</span>
                          <span className="font-semibold">{stats.totalClients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Заказов</span>
                          <span className="font-semibold">{stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Объем продаж</span>
                          <span className="font-semibold">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Комиссии</span>
                          <span className="font-semibold text-green-600">{stats.totalCommissions.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

