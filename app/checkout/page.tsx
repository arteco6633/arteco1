'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartContext'
import { useState } from 'react'

export default function CheckoutPage() {
  const { items, total } = useCart()
  const [acceptAll, setAcceptAll] = useState(false)
  const [consents, setConsents] = useState({
    privacy: false,
    marketing: false,
    calls: false,
  })

  function toggleAcceptAll() {
    const next = !acceptAll
    setAcceptAll(next)
    setConsents({ privacy: next, marketing: next, calls: next })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Оформление заказа</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 space-y-6">
          <section className="bg-white border rounded-xl p-5">
            <div className="text-lg font-semibold mb-4">Контакты</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Имя" />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Телефон" />
              <input className="w-full border rounded-lg px-3 py-2 sm:col-span-2" placeholder="Email (необязательно)" />
            </div>
          </section>

          {/* Заполните информацию о себе */}
          <section className="bg-white border rounded-xl p-5">
            <div className="text-lg font-semibold mb-4">Заполните информацию о себе</div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Имя" />
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Телефон" />
                <input className="w-full border rounded-lg px-3 py-2 sm:col-span-2" placeholder="Почта" />
              </div>
              <div className="text-sm text-gray-600">Чтобы оформить заказ, нам нужно разрешение на использование ваших данных:</div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptAll} onChange={toggleAcceptAll} />
                  <span>Принять все</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consents.privacy}
                    onChange={() => setConsents(v => ({ ...v, privacy: !v.privacy }))}
                  />
                  <span>Согласен на обработку персональных данных на условиях Политики конфиденциальности</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consents.marketing}
                    onChange={() => setConsents(v => ({ ...v, marketing: !v.marketing }))}
                  />
                  <span>Согласен на получение рассылок рекламно-информационного характера</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consents.calls}
                    onChange={() => setConsents(v => ({ ...v, calls: !v.calls }))}
                  />
                  <span>Согласен на получение массовых и автоматических звонков</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-5">
            <div className="text-lg font-semibold mb-4">Доставка</div>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="delivery" defaultChecked />
                <span>Курьер</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="delivery" />
                <span>Самовывоз</span>
              </label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Адрес" />
            </div>
          </section>

          <section className="bg-white border rounded-xl p-5">
            <div className="text-lg font-semibold mb-4">Оплата</div>
            <div className="space-y-3">
              <label className="flex items-center gap-2"><input type="radio" name="pay" defaultChecked /> <span>Картой онлайн</span></label>
              <label className="flex items-center gap-2"><input type="radio" name="pay" /> <span>При получении</span></label>
            </div>
          </section>
        </form>

        <aside className="bg-white border rounded-xl p-5 h-max sticky top-24">
          <div className="text-lg font-semibold mb-4">Ваш заказ</div>
          <div className="space-y-3 mb-4 max-h-[40vh] overflow-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <img src={it.image_url || '/placeholder.jpg'} className="w-14 h-14 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm line-clamp-2">{it.name}</div>
                  <div className="text-xs text-gray-500">× {it.qty}</div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">{(it.price * it.qty).toLocaleString('ru-RU')} ₽</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>Итого</div>
            <div className="text-2xl font-bold">{total.toLocaleString('ru-RU')} ₽</div>
          </div>
          <button className="w-full py-3 rounded-full bg-black text-white font-semibold">Подтвердить заказ</button>
          <Link href="/cart" className="block text-center text-sm text-gray-500 mt-3">Вернуться в корзину</Link>
        </aside>
      </div>
    </div>
  )
}


