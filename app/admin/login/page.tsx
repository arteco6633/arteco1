'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search?.get('next') || '/admin'

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      if (res.ok) {
        router.replace(next)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Ошибка входа')
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border rounded-xl p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход в админ-панель</h1>
        <label className="block text-sm font-medium mb-1">Логин</label>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="Логин"
          autoFocus
        />
        <label className="block text-sm font-medium mb-1">Пароль</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="Пароль"
          type="password"
        />
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}


