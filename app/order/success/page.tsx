"use client"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('order')
  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">Спасибо за заказ!</h1>
      <p className="text-gray-700 mb-8">{id ? <>Заказ номер <span className="font-semibold">{Number(id).toLocaleString('ru-RU')}</span> появится в личном кабинете после подтверждения.</> : 'Ваш заказ появится в личном кабинете после подтверждения.'}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border rounded-xl p-5">
          <div className="w-12 h-12 rounded-full border grid place-items-center mb-3">📞</div>
          <div className="font-semibold mb-1">Звонок оператора</div>
          <div className="text-sm text-gray-600">В течение 10 минут мы вам перезвоним.</div>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="w-12 h-12 rounded-full border grid place-items-center mb-3">🚚</div>
          <div className="font-semibold mb-1">Доставка</div>
          <div className="text-sm text-gray-600">Согласуем удобное время и дату доставки.</div>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="w-12 h-12 rounded-full border grid place-items-center mb-3">💳</div>
          <div className="font-semibold mb-1">Оплата заказа</div>
          <div className="text-sm text-gray-600">Способ оплаты вы выбрали при оформлении.</div>
        </div>
      </div>

      <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white">Продолжить покупки →</Link>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">Загрузка…</div>}>
      <SuccessContent />
    </Suspense>
  )
}


