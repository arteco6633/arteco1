'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Order {
  id: number
  created_at: string
  status: string
  total: number
  total_amount?: number
  contact?: any
  items?: any[]
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'Новый',
    processing: 'В обработке',
    pending: 'Ожидает',
    delivered: 'Доставлен',
    completed: 'Завершен',
    cancelled: 'Отменен',
  }
  return statusMap[status] || status
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export default function AccountOrdersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userPhone, setUserPhone] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (!session) {
      router.push('/?auth=1')
      return
    }

    const phone = (session as any)?.phone
    if (!phone) {
      router.push('/?auth=1')
      return
    }

    setUserPhone(phone)
    loadOrders(phone)
  }, [session, sessionStatus, router])

  async function loadOrders(phone: string) {
    try {
      setLoading(true)
      
      // Нормализуем телефон пользователя для поиска
      const normalizePhone = (p: string) => {
        if (!p) return ''
        // Убираем все нецифровые символы
        let cleaned = p.replace(/\D/g, '')
        // Если начинается с 8, заменяем на 7
        if (cleaned.startsWith('8')) {
          cleaned = '7' + cleaned.slice(1)
        }
        // Если начинается с +7, убираем +
        if (cleaned.startsWith('7')) {
          cleaned = '+' + cleaned
        } else if (!cleaned.startsWith('+')) {
          cleaned = '+' + cleaned
        }
        return cleaned
      }

      const normalizedUserPhone = normalizePhone(phone)
      
      // Загружаем все заказы
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500) // Увеличиваем лимит для надежности

      if (error) {
        console.error('Ошибка загрузки заказов:', error)
        return
      }

      // Фильтруем заказы по телефону пользователя
      const userOrders = (data || []).filter((order: Order) => {
        const contact = order.contact as any
        const orderPhone = contact?.phone || ''
        
        if (!orderPhone) return false
        
        // Нормализуем телефон из заказа
        const normalizedOrderPhone = normalizePhone(orderPhone)
        
        // Сравниваем нормализованные телефоны
        // Также проверяем варианты без + и с разными форматами
        const userPhoneDigits = normalizedUserPhone.replace(/\D/g, '')
        const orderPhoneDigits = normalizedOrderPhone.replace(/\D/g, '')
        
        // Сравниваем последние 10 цифр (без кода страны)
        const userLast10 = userPhoneDigits.slice(-10)
        const orderLast10 = orderPhoneDigits.slice(-10)
        
        return userLast10 === orderLast10 || 
               normalizedUserPhone === normalizedOrderPhone ||
               userPhoneDigits === orderPhoneDigits
      })

      setOrders(userOrders as Order[])
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Мои заказы</h1>
          <p className="mt-2 text-gray-600">История ваших заказов</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Заказов пока нет</h3>
            <p className="mt-2 text-gray-500">Когда вы оформите заказ, он появится здесь</p>
            <Link
              href="/catalog"
              className="mt-6 inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderTotal = order.total_amount || order.total || 0
              const orderDate = new Date(order.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Заказ #{order.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Оформлен: {orderDate}</p>
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Товаров: {order.items.length}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {orderTotal.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

