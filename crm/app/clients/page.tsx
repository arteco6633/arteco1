'use client'

import { useEffect, useState } from 'react'
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

interface Client {
  id: number
  partner_id: number
  name: string
  phone: string
  email: string | null
  notes: string | null
  created_at: string
}

interface Partner {
  id: number
  name: string | null
  phone: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<(Client & { partner?: Partner })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      const { data, error } = await supabaseServer
        .from('partner_clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Ошибка загрузки клиентов:', error)
        return
      }

      // Загружаем информацию о партнерах
      const partnerIds = [...new Set((data || []).map((c: Client) => c.partner_id))]
      const { data: partnersData } = await supabaseServer
        .from('partners')
        .select('id, name, phone')
        .in('id', partnerIds)

      const partnersMap = new Map((partnersData || []).map((p: Partner) => [p.id, p]))

      const clientsWithPartners = (data || []).map((client: Client) => ({
        ...client,
        partner: partnersMap.get(client.partner_id)
      }))

      setClients(clientsWithPartners)
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900">ARTECO CRM</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Дашборд
                </Link>
                <Link href="/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Заказы
                </Link>
                <Link href="/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Пользователи
                </Link>
                <Link href="/partners" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Партнеры
                </Link>
                <Link href="/clients" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Клиенты партнеров
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Клиенты партнеров</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка клиентов...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Клиентов не найдено</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <li key={client.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-pink-300 flex items-center justify-center">
                              <span className="text-pink-800 font-medium">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500">{client.phone}</div>
                            {client.email && (
                              <div className="text-xs text-gray-400">{client.email}</div>
                            )}
                            {client.notes && (
                              <div className="text-xs text-gray-400 mt-1 italic">{client.notes}</div>
                            )}
                            {client.partner && (
                              <div className="text-xs text-indigo-600 mt-1">
                                Партнер: {client.partner.name || client.partner.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

