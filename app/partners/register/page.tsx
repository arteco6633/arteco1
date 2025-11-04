'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PartnerRegister() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    companyName: '',
    partnerType: '' as 'architect' | 'designer' | 'manufacturer' | 'realtor' | 'developer' | 'foreman' | ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      setLoading(false)
      return
    }

    if (!formData.partnerType) {
      setError('Выберите тип партнера')
      setLoading(false)
      return
    }

    try {
      // Проверяем, существует ли партнер с таким телефоном
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('phone', formData.phone)
        .single()

      if (existingPartner) {
        setError('Партнер с таким телефоном уже зарегистрирован')
        setLoading(false)
        return
      }

      // В реальном приложении нужно использовать bcrypt для хеширования пароля
      // Для демонстрации сохраняем пароль как есть (в production ОБЯЗАТЕЛЬНО использовать bcrypt)
      const passwordHash = formData.password // В production: await bcrypt.hash(formData.password, 10)

      // Создаем партнера
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          phone: formData.phone,
          password_hash: passwordHash,
          name: formData.name || null,
          email: formData.email || null,
          company_name: formData.companyName || null,
          partner_type: formData.partnerType,
          commission_rate: 10.00, // По умолчанию 10%
          is_active: true
        })
        .select()
        .single()

      if (partnerError) {
        setError('Ошибка при регистрации. Попробуйте позже.')
        console.error('Ошибка регистрации:', partnerError)
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
      setError('Ошибка при регистрации')
      console.error('Ошибка регистрации:', err)
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
          <span className="text-gray-900">Регистрация</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Регистрация партнера</h1>
          <p className="text-gray-600 mb-6">Заполните форму, чтобы стать партнером ARTECO</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="partnerType" className="block text-sm font-medium text-gray-700 mb-2">
                Тип партнера <span className="text-red-500">*</span>
              </label>
              <select
                id="partnerType"
                name="partnerType"
                value={formData.partnerType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Выберите тип</option>
                <option value="architect">Архитектор</option>
                <option value="designer">Дизайнер</option>
                <option value="manufacturer">Производитель</option>
                <option value="realtor">Риелтор</option>
                <option value="developer">Застройщик</option>
                <option value="foreman">Прораб</option>
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Название компании
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Название вашей компании"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/partners/login" className="text-black font-semibold hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

