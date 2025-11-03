'use client'

import Link from 'next/link'

export default function AdminHomePage() {
  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } catch {}
  }

  const card = (href: string, title: string, desc: string) => (
    <Link
      href={href}
      className="block p-5 rounded-xl border hover:shadow-md transition-shadow bg-white"
    >
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-sm text-gray-500">{desc}</div>
    </Link>
  )

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Админ‑панель</h1>
        <button
          onClick={logout}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {card('/admin/products', 'Товары', 'Список товаров и управление')}
        {card('/admin/categories', 'Категории', 'Структура каталога')}
        {card('/admin/banners', 'Баннеры', 'Промо и визуальные блоки')}
        {card('/admin/modules', 'Модули кухонь', 'Создание, редактирование и импорт модулей')}
        {card('/admin/journal', 'Журнал', 'Статьи и публикации')}
      </div>
    </main>
  )
}


