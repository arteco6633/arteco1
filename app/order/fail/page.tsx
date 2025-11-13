'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderFailPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Оплата не прошла
        </h1>
        <p className="text-gray-600 mb-6">
          К сожалению, произошла ошибка при обработке платежа. Пожалуйста, попробуйте ещё раз или выберите другой способ оплаты.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Номер заказа: <span className="font-semibold">#{orderId}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/cart"
            className="flex-1 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-black/90 transition-colors text-center"
          >
            Вернуться в корзину
          </Link>
          {orderId && (
            <Link
              href={`/account/orders/${orderId}`}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Посмотреть заказ
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
