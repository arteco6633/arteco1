'use client'

import dynamic from 'next/dynamic'

// Динамический импорт тяжелых компонентов для улучшения производительности
const TBankWidgetWrapper = dynamic(() => import('@/components/TBankWidgetWrapper'), {
  ssr: false,
})
const DolyameSnippet = dynamic(() => import('@/components/DolyameSnippet'), {
  ssr: false,
})
const YandexPaySdk = dynamic(() => import('@/components/YandexPaySdk'), {
  ssr: false,
})

export default function LazyPaymentWidgets() {
  return (
    <>
      <TBankWidgetWrapper />
      <DolyameSnippet />
      <YandexPaySdk />
    </>
  )
}


