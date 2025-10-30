'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'phone' | 'yandex'>('phone')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function sendOtp() {
    setError(null)
    setLoading(true)
    try {
      const resp = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
      if (!resp.ok) throw new Error('Не удалось отправить код')
      setOtpSent(true)
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить код')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', { phone, code, redirect: false })
      if (res?.error) throw new Error('Неверный код')
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  function signInYandex() {
    // NextAuth будет обрабатывать редирект
    window.location.href = '/api/auth/signin?provider=yandex'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-full text-sm ${tab==='phone'?'bg-black text-white':'bg-gray-100 text-gray-700'}`}
              onClick={() => setTab('phone')}
            >По телефону</button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${tab==='yandex'?'bg-black text-white':'bg-gray-100 text-gray-700'}`}
              onClick={() => setTab('yandex')}
            >Яндекс ID</button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>

        <div className="p-5">
          {tab === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <label className="block text-sm text-gray-600">Номер телефона</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 000-00-00"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  <button onClick={sendOtp} disabled={loading || !phone}
                    className="w-full bg-black text-white rounded-full py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50">
                    {loading ? 'Отправляем…' : 'Получить код'}
                  </button>
                </>
              ) : (
                <>
                  <label className="block text-sm text-gray-600">Код из SMS</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-400 tracking-widest"
                  />
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  <button onClick={verifyOtp} disabled={loading || code.length < 4}
                    className="w-full bg-black text-white rounded-full py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50">
                    {loading ? 'Проверяем…' : 'Войти'}
                  </button>
                  <button onClick={() => { setOtpSent(false); setCode('') }} className="w-full mt-2 text-sm text-gray-600 hover:text-black">Изменить номер</button>
                </>
              )}
            </div>
          )}

          {tab === 'yandex' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Вход через Яндекс ID. Вы будете перенаправлены на yandex.ru для авторизации.</p>
              <button onClick={signInYandex} className="w-full bg-[#FFCC00] text-black rounded-full py-2.5 font-semibold hover:brightness-95 transition">Войти через Яндекс</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


