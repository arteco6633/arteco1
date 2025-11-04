'use client'

import { useEffect, useState } from 'react'
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

interface Partner {
  id: number
  phone: string
  name: string | null
  email: string | null
  company_name: string | null
  partner_type: string
  is_active: boolean
  created_at: string
}

export default function CRMPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartners()
  }, [])

  async function loadPartners() {
    try {
      setLoading(true)
      const { data, error } = await supabaseServer
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Ошибка загрузки партнеров:', error)
        return
      }

      setPartners(data || [])
    } catch (error) {
      console.error('Ошибка загрузки партнеров:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPartnerTypeText(type: string) {
    const types: Record<string, string> = {
      architect: 'Архитектор',
      designer: 'Дизайнер',
      manufacturer: 'Производитель',
      realtor: 'Риелтор',
      developer: 'Застройщик',
      foreman: 'Прораб'
    }
    return types[type] || type
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
                <Link href="/crm/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Заказы
                </Link>
                <Link href="/crm/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Пользователи
                </Link>
                <Link href="/crm/partners" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Партнеры</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка партнеров...</p>
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Партнеров не найдено</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {partners.map((partner) => (
                  <li key={partner.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-300 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {partner.name ? partner.name.charAt(0).toUpperCase() : partner.phone.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {partner.name || 'Без имени'}
                            </div>
                            <div className="text-sm text-gray-500">{partner.phone}</div>
                            {partner.email && (
                              <div className="text-xs text-gray-400">{partner.email}</div>
                            )}
                            {partner.company_name && (
                              <div className="text-xs text-gray-400">{partner.company_name}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            partner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {partner.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                          <div className="mt-1 text-xs text-gray-500">
                            {getPartnerTypeText(partner.partner_type)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(partner.created_at).toLocaleDateString('ru-RU')}
                          </div>
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

