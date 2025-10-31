'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function CartDrawer() {
  const { items, total, updateQty, remove, open, setOpen } = useCart()
  const pathname = usePathname()

  // Автоматически закрывать корзину при переходе на страницу /cart
  useEffect(() => {
    if (pathname === '/cart' && open) setOpen(false)
  }, [pathname, open, setOpen])
  return (
    <div className={`fixed inset-0 z-[90] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <aside className={`absolute right-0 top-0 h-full w-[92%] sm:w-[420px] bg-white shadow-xl transition-transform pb-8 sm:pb-10 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-xl font-semibold">Корзина</div>
          <button className="text-2xl leading-none text-gray-500 hover:text-black" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
        </div>
        <div className="h-[calc(100%-160px)] overflow-auto p-4 space-y-4">
          {items.length === 0 && <div className="text-sm text-gray-500">Ваша корзина пуста</div>}
          {items.map((it) => {
            const key = `${it.id}|${it.color || ''}|${it.options ? JSON.stringify(it.options) : ''}`
            return (
              <div key={key} className="flex gap-3 border rounded-lg p-3">
                <img src={it.image_url || '/placeholder.jpg'} alt={it.name} className="w-20 h-20 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium line-clamp-2">{it.name}</div>
                  {it.color && <div className="text-xs text-gray-500 mt-0.5">Цвет: {it.color}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <button className="w-8 h-8 border rounded-lg text-base" onClick={() => updateQty(it.id, it.qty - 1, key)} aria-label="Уменьшить">-</button>
                    <div className="px-2 text-sm min-w-[20px] text-center">{it.qty}</div>
                    <button className="w-8 h-8 border rounded-lg text-base" onClick={() => updateQty(it.id, it.qty + 1, key)} aria-label="Увеличить">+</button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{(it.price * it.qty).toLocaleString('ru-RU')} ₽</div>
                  <button className="text-xs text-red-600 mt-2" onClick={() => remove(it.id, key)}>Удалить</button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-4 pb-40 border-t bg-white pb-[calc(env(safe-area-inset-bottom)+96px)]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Итого</div>
            <div className="text-xl font-bold">{total.toLocaleString('ru-RU')} ₽</div>
          </div>
          <Link href="/cart" onClick={() => setOpen(false)} className="block w-full text-center py-3.5 rounded-[50px] bg-black text-white font-semibold mb-3">Оформить заказ</Link>
          <div className="h-12 sm:h-0" aria-hidden></div>
        </div>
      </aside>
    </div>
  )
}


