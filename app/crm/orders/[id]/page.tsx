'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

interface Order {
  id: number
  order_number?: string
  user_name?: string | null
  user_phone?: string | null
  user_email?: string | null
  total_amount?: number
  total?: number
  status: string
  payment_method?: string | null
  delivery_type?: string | null
  address?: string | null
  need_assembly?: boolean | null
  need_utilization?: boolean | null
  contact?: any // JSONB
  delivery?: any // JSONB
  payment?: any // JSONB
  items?: any // JSONB
  created_at: string
  updated_at?: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number | null
  product_name: string
  quantity: number
  price: number
  options: any
}

export default function CRMOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  async function loadOrder() {
    try {
      setLoading(true)
      
      // Загружаем заказ
      const { data: orderData, error: orderError } = await supabaseServer
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('Ошибка загрузки заказа:', orderError)
        return
      }

      // Преобразуем данные из JSONB полей
      const formattedOrder = {
        ...orderData,
        order_number: orderData.order_number || `#${orderData.id}`,
        user_name: orderData.user_name || orderData.contact?.name || orderData.contact?.user_name || null,
        user_phone: orderData.user_phone || orderData.contact?.phone || orderData.contact?.user_phone || null,
        user_email: orderData.user_email || orderData.contact?.email || orderData.contact?.user_email || null,
        total_amount: orderData.total_amount || orderData.total || 0,
        payment_method: orderData.payment_method || orderData.payment?.method || null,
        delivery_type: orderData.delivery_type || orderData.delivery?.type || null,
        address: orderData.address || orderData.delivery?.address || null,
        need_assembly: orderData.need_assembly || orderData.delivery?.need_assembly || null,
        need_utilization: orderData.need_utilization || orderData.delivery?.need_utilization || null
      }

      setOrder(formattedOrder)

      // Загружаем товары заказа (из таблицы order_items или из JSONB поля items)
      if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        // Если товары в JSONB поле items
        const items = orderData.items.map((item: any, index: number) => {
          // Извлекаем опции из item
          const options: any = {}
          
          // Если есть явное поле options
          if (item.options && typeof item.options === 'object') {
            Object.assign(options, item.options)
          }
          
          // Если есть colorName отдельно
          if (item.colorName) {
            options.colorName = item.colorName
          } else if (item.color) {
            options.colorName = item.color
          }
          
          // Если есть color отдельно
          if (item.color && !options.colorName) {
            options.colorName = item.color
          }
          
          return {
            id: index + 1,
            order_id: orderData.id,
            product_id: item.product_id || item.id || null,
            product_name: item.product_name || item.name || 'Товар',
            quantity: item.quantity || item.qty || 1,
            price: item.price || 0,
            options: Object.keys(options).length > 0 ? options : null
          }
        })
        setOrderItems(items)
      } else {
        // Если товары в отдельной таблице order_items
        const { data: itemsData, error: itemsError } = await supabaseServer
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (itemsError) {
          console.error('Ошибка загрузки товаров заказа:', itemsError)
          setOrderItems([])
        } else {
          setOrderItems(itemsData || [])
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
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

  async function handleDeleteOrder() {
    if (!order) return
    
    if (!confirm(`Вы уверены, что хотите удалить заказ #${order.id}? Это действие нельзя отменить.`)) {
      return
    }

    try {
      setDeleting(true)
      const resp = await fetch('/api/crm/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id })
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data?.error || 'Не удалось удалить заказ')
      }

      // Перенаправляем на страницу списка заказов
      router.push('/crm/orders')
    } catch (err: any) {
      console.error('Ошибка удаления заказа:', err)
      alert(err?.message || 'Не удалось удалить заказ')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Заказ не найден</p>
          <Link href="/crm/orders" className="text-blue-600 hover:text-blue-500">
            Вернуться к списку заказов
          </Link>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/crm/orders" className="text-blue-600 hover:text-blue-500 text-sm mb-4 inline-block">
              ← Вернуться к списку заказов
            </Link>
            <div className="flex items-center justify-between mt-2">
              <h2 className="text-3xl font-bold text-gray-900">Заказ #{order.order_number}</h2>
              <button
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {deleting ? 'Удаление...' : 'Удалить заказ'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              {/* Информация о клиенте */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о клиенте</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Имя</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.user_name || 'Не указано'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.user_phone || 'Не указано'}</dd>
                  </div>
                  {order.user_email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{order.user_email}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Товары заказа */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Товары заказа</h3>
                {orderItems.length === 0 ? (
                  <p className="text-gray-500">Товары не найдены</p>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.product_name}</h4>
                            <p className="text-sm text-gray-500 mt-1">Количество: {item.quantity}</p>
                            {item.options && Object.keys(item.options).length > 0 && (
                              <div className="mt-3 space-y-2">
                                {/* Цвет */}
                                {item.options.colorName && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Цвет:</span> {String(item.options.colorName)}
                                  </div>
                                )}
                                
                                {/* Петли */}
                                {item.options.hinge && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Петли:</span> {
                                      typeof item.options.hinge === 'object' && item.options.hinge !== null
                                        ? (item.options.hinge.name || 'Не указано') + 
                                          (item.options.hinge.delta_price ? ` (+${item.options.hinge.delta_price} ₽)` : '')
                                        : String(item.options.hinge)
                                    }
                                  </div>
                                )}
                                
                                {/* Ящики */}
                                {item.options.drawer && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Ящики:</span> {
                                      typeof item.options.drawer === 'object' && item.options.drawer !== null
                                        ? (item.options.drawer.name || 'Не указано') + 
                                          (item.options.drawer.delta_price ? ` (+${item.options.drawer.delta_price} ₽)` : '')
                                        : String(item.options.drawer)
                                    }
                                  </div>
                                )}
                                
                                {/* Наполнение */}
                                {item.options.filling && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Наполнение:</span> {
                                      typeof item.options.filling === 'object' && item.options.filling !== null
                                        ? (item.options.filling.name || 'Не указано') + 
                                          (item.options.filling.delta_price ? ` (+${item.options.filling.delta_price} ₽)` : '')
                                        : String(item.options.filling)
                                    }
                                  </div>
                                )}
                                
                                {/* Подсветка */}
                                {item.options.lighting && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Подсветка:</span> {
                                      typeof item.options.lighting === 'object' && item.options.lighting !== null
                                        ? (item.options.lighting.name || 'Не указано') + 
                                          (item.options.lighting.delta_price ? ` (+${item.options.lighting.delta_price} ₽)` : '')
                                        : String(item.options.lighting)
                                    }
                                  </div>
                                )}
                                
                                {/* Модули */}
                                {item.options.modules && Array.isArray(item.options.modules) && item.options.modules.length > 0 && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">Модули:</span>
                                    <div className="mt-1 ml-3 space-y-1">
                                      {item.options.modules.map((module: any, idx: number) => (
                                        <div key={idx}>
                                          • {module.name || 'Модуль'} 
                                          {module.qty > 1 ? ` (${module.qty} шт.)` : ''}
                                          {module.price ? ` — ${module.price.toLocaleString('ru-RU')} ₽` : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Другие опции (если есть) */}
                                {Object.entries(item.options).map(([key, value]) => {
                                  if (['colorName', 'hinge', 'drawer', 'filling', 'lighting', 'modules'].includes(key)) return null
                                  if (value === null || value === undefined) return null
                                  return (
                                    <div key={key} className="text-xs text-gray-700">
                                      <span className="font-medium">{key}:</span> {
                                        typeof value === 'object' && value !== null
                                          ? JSON.stringify(value, null, 2)
                                          : String(value)
                                      }
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {item.price.toLocaleString('ru-RU')} ₽
                            </p>
                            <p className="text-xs text-gray-500">
                              Итого: {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              {/* Статус заказа */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус заказа</h3>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              {/* Доставка и оплата */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Доставка и оплата</h3>
                <dl className="space-y-3">
                  {order.delivery_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Способ доставки</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {order.delivery_type === 'courier' ? 'Курьер' : 
                         order.delivery_type === 'pickup' ? 'Самовывоз' : 
                         order.delivery_type}
                      </dd>
                    </div>
                  )}
                  {order.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Адрес</dt>
                      <dd className="mt-1 text-sm text-gray-900">{order.address}</dd>
                    </div>
                  )}
                  {order.payment_method && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Способ оплаты</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {order.payment_method === 'cod' ? 'Наличными при получении' :
                         order.payment_method === 'yandex_pay' ? 'Яндекс Пэй' :
                         order.payment_method === 'card_online' ? 'Картой онлайн' :
                         order.payment_method === 'bank_transfer' ? 'Безналичная' :
                         order.payment_method === 'sberpay' ? 'SberPay' :
                         order.payment_method === 'yandex_split' ? 'Яндекс Сплит' :
                         order.payment_method === 'installment' ? 'Рассрочка' :
                         order.payment_method}
                      </dd>
                    </div>
                  )}
                  {order.need_assembly && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Сборка</dt>
                      <dd className="mt-1 text-sm text-gray-900">Требуется</dd>
                    </div>
                  )}
                  {order.need_utilization && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Утилизация</dt>
                      <dd className="mt-1 text-sm text-gray-900">Требуется</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Сумма заказа */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Сумма заказа</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Товары ({orderItems.length})</span>
                    <span className="text-gray-900">{(order.total_amount || order.total || 0).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Итого</span>
                      <span className="text-lg font-semibold text-gray-900">{(order.total_amount || order.total || 0).toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Даты */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Даты</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Создан</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </dd>
                  </div>
                  {order.updated_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Обновлен</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(order.updated_at).toLocaleString('ru-RU')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

