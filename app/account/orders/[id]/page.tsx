'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Order {
  id: number
  created_at: string
  status: string
  total: number
  total_amount?: number
  contact?: any
  items?: any[]
  delivery?: any
  payment?: any
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

export default function OrderDetailPage() {
  const { data: session, status: sessionStatus } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [productImages, setProductImages] = useState<Record<number, string>>({})
  const [moduleImages, setModuleImages] = useState<Record<number, string>>({})

  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (!session) {
      router.push('/?auth=1')
      return
    }

    if (orderId) {
      loadOrder(orderId)
    }
  }, [orderId, session, sessionStatus, router])

  async function loadOrder(id: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Ошибка загрузки заказа:', error)
        router.push('/account/orders')
        return
      }

      // Проверяем, что заказ принадлежит текущему пользователю
      const userPhone = (session as any)?.phone
      const contact = data.contact as any
      const orderPhone = contact?.phone || ''
      
      if (userPhone && orderPhone) {
        // Нормализуем телефоны для сравнения
        const normalizePhone = (p: string) => {
          if (!p) return ''
          let cleaned = p.replace(/\D/g, '')
          if (cleaned.startsWith('8')) {
            cleaned = '7' + cleaned.slice(1)
          }
          return cleaned
        }
        
        const userPhoneDigits = normalizePhone(userPhone)
        const orderPhoneDigits = normalizePhone(orderPhone)
        
        // Сравниваем последние 10 цифр
        const userLast10 = userPhoneDigits.slice(-10)
        const orderLast10 = orderPhoneDigits.slice(-10)
        
        if (userLast10 !== orderLast10 && userPhoneDigits !== orderPhoneDigits) {
          router.push('/account/orders')
          return
        }
      }

      setOrder(data as Order)

      // Загружаем изображения товаров и модулей
      const items = (data as Order).items || []
      const productIds = Array.from(new Set(items.map((item: any) => item.id).filter(Boolean)))
      const moduleIds: number[] = []

      // Собираем ID модулей из опций
      items.forEach((item: any) => {
        if (item.options?.modules) {
          const modules = Array.isArray(item.options.modules) ? item.options.modules : []
          modules.forEach((m: any) => {
            if (m?.id) moduleIds.push(Number(m.id))
          })
        }
      })

      // Загружаем изображения товаров
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, image_url')
          .in('id', productIds)

        if (productsData) {
          const images: Record<number, string> = {}
          productsData.forEach((p: any) => {
            if (p.image_url) images[p.id] = p.image_url
          })
          setProductImages(images)
        }
      }

      // Загружаем изображения модулей
      if (moduleIds.length > 0) {
        const { data: modulesData } = await supabase
          .from('product_modules')
          .select('id, image_url')
          .in('id', moduleIds)

        if (modulesData) {
          const images: Record<number, string> = {}
          modulesData.forEach((m: any) => {
            if (m.image_url) images[m.id] = m.image_url
          })
          setModuleImages(images)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
      router.push('/account/orders')
    } finally {
      setLoading(false)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>
    )
  }

  if (!session || !order) {
    return null
  }

  const orderTotal = order.total_amount || order.total || 0
  const orderDate = new Date(order.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const contact = order.contact || {}
  const delivery = order.delivery || {}
  const payment = order.payment || {}
  const items = order.items || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к заказам
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Заказ #{order.id}</h1>
                <p className="text-sm text-gray-500 mt-1">Оформлен: {orderDate}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Товары */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Товары</h2>
              <div className="space-y-6">
                {items.map((item: any, idx: number) => {
                  const productImage = item.image_url || (item.id ? productImages[item.id] : null)
                  const options = item.options || {}
                  
                  return (
                    <div key={idx} className="pb-6 border-b border-gray-200 last:border-0">
                      <div className="flex gap-4 mb-4">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={item.name}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.name}</h3>
                          <p className="text-sm text-gray-500 mb-3">Количество: {item.qty || 1}</p>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              {((item.price || 0) * (item.qty || 1)).toLocaleString('ru-RU')} ₽
                            </p>
                            {item.qty > 1 && (
                              <p className="text-sm text-gray-500">
                                {item.price?.toLocaleString('ru-RU')} ₽ × {item.qty}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Опции товара */}
                      {(item.color || Object.keys(options).length > 0) && (
                        <div className="ml-0 sm:ml-36 space-y-3">
                          {item.color && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Цвет:</span>
                              <span className="text-sm text-gray-600">{item.color}</span>
                            </div>
                          )}

                          {options.filling && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-700">Наполнение:</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-600">{options.filling.name || options.filling}</span>
                                {options.filling.delta_price && options.filling.delta_price > 0 && (
                                  <span className="text-sm text-green-600 ml-2">
                                    +{options.filling.delta_price.toLocaleString('ru-RU')} ₽
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {options.hinge && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-700">Петли:</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-600">{options.hinge.name || options.hinge}</span>
                                {options.hinge.delta_price && options.hinge.delta_price > 0 && (
                                  <span className="text-sm text-green-600 ml-2">
                                    +{options.hinge.delta_price.toLocaleString('ru-RU')} ₽
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {options.drawer && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-700">Ящики:</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-600">{options.drawer.name || options.drawer}</span>
                                {options.drawer.delta_price && options.drawer.delta_price > 0 && (
                                  <span className="text-sm text-green-600 ml-2">
                                    +{options.drawer.delta_price.toLocaleString('ru-RU')} ₽
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {options.lighting && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-700">Подсветка:</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-600">{options.lighting.name || options.lighting}</span>
                                {options.lighting.delta_price && options.lighting.delta_price > 0 && (
                                  <span className="text-sm text-green-600 ml-2">
                                    +{options.lighting.delta_price.toLocaleString('ru-RU')} ₽
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {options.modules && Array.isArray(options.modules) && options.modules.length > 0 && (
                            <div className="mt-4">
                              <span className="text-sm font-medium text-gray-700 block mb-2">Модули:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {options.modules.map((module: any, modIdx: number) => {
                                  const moduleImage = module.image_url || (module.id ? moduleImages[module.id] : null)
                                  return (
                                    <div key={modIdx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                      {moduleImage && (
                                        <div className="w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
                                          <Image
                                            src={moduleImage}
                                            alt={module.name || `Модуль ${modIdx + 1}`}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                          {module.name || `Модуль ${modIdx + 1}`}
                                        </p>
                                        {module.qty > 1 && (
                                          <p className="text-xs text-gray-500 mt-1">Количество: {module.qty}</p>
                                        )}
                                        {module.price && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {module.price.toLocaleString('ru-RU')} ₽
                                            {module.qty > 1 && ` × ${module.qty} = ${(module.price * module.qty).toLocaleString('ru-RU')} ₽`}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Контактная информация */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Контактная информация</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {contact.name && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Имя:</span> {contact.name}
                  </p>
                )}
                {contact.phone && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Телефон:</span> {contact.phone}
                  </p>
                )}
                {contact.email && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Email:</span> {contact.email}
                  </p>
                )}
              </div>
            </div>

            {/* Доставка */}
            {delivery.type && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Доставка</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Способ:</span>{' '}
                    {delivery.type === 'courier' ? 'Курьером' : 'Самовывоз'}
                  </p>
                  {delivery.address && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Адрес:</span> {delivery.address}
                    </p>
                  )}
                  {delivery.needAssembly && (
                    <p className="text-sm text-green-600">✓ Требуется сборка</p>
                  )}
                  {delivery.needUtilization && (
                    <p className="text-sm text-green-600">✓ Требуется утилизация</p>
                  )}
                </div>
              </div>
            )}

            {/* Оплата */}
            {payment.method && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Оплата</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Способ:</span>{' '}
                    {payment.method === 'cod' ? 'Наложенный платеж' : 
                     payment.method === 'card' ? 'Банковская карта' : 
                     payment.method === 'online' ? 'Онлайн оплата' : payment.method}
                  </p>
                </div>
              </div>
            )}

            {/* Итого */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Итого:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {orderTotal.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

