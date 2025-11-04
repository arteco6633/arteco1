'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PartnerLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Отправка кода на телефон
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (response.ok) {
        setStep('code')
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка отправки кода')
      }
    } catch (err) {
      setError('Ошибка при отправке кода')
    } finally {
      setLoading(false)
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Авторизация через NextAuth
      const result = await signIn('credentials', {
        phone,
        code,
        redirect: false,
        callbackUrl: '/partners/cabinet'
      })

      if (result?.error) {
        setError('Неверный код')
      } else if (result?.ok) {
        router.push('/partners/cabinet')
      }
    } catch (err) {
      setError('Ошибка при входе')
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

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Отправка...' : 'Получить код'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Код подтверждения
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-gray-500 mt-2">Код отправлен на {phone}</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone')
                    setCode('')
                    setError('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/partners" className="text-black font-semibold hover:underline">
                Стать партнером
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

