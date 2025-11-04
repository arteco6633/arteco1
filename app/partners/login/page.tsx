'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PartnerLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Получаем партнера по телефону
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .single()

      if (partnerError || !partner) {
        setError('Неверный телефон или пароль')
        setLoading(false)
        return
      }

      // Проверяем пароль (в реальном приложении нужно использовать bcrypt)
      // Для демонстрации используем простую проверку
      // В production нужно использовать bcrypt.compare()
      if (partner.password_hash !== password) {
        setError('Неверный телефон или пароль')
        setLoading(false)
        return
      }

      // Сохраняем информацию о партнере в sessionStorage
      sessionStorage.setItem('partner', JSON.stringify({
        id: partner.id,
        phone: partner.phone,
        name: partner.name,
        partner_type: partner.partner_type
      }))

      // Перенаправляем в личный кабинет
      router.push('/partners/cabinet')
    } catch (err) {
      setError('Ошибка при входе')
      console.error('Ошибка входа:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Хлебные крошки */}
        <nav className="flex mb-6 text-xs sm:text-sm text-gray-500 flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          <span>/</span>
          <Link href="/partners" className="hover:text-gray-700">Партнерам</Link>
          <span>/</span>
          <span className="text-gray-900">Вход</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Вход в личный кабинет партнера</h1>
          <p className="text-gray-600 mb-6">Войдите, чтобы получить доступ к своей статистике и заказам</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/partners/register" className="text-black font-semibold hover:underline">
                Стать партнером
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

