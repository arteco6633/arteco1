"use client"

import Link from 'next/link'
import { useCart } from '@/components/CartContext'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductGrid from '@/components/ProductGrid'

export default function CartPage() {
  const { items, total, updateQty, remove, clear, add } = useCart()
  const router = useRouter()
  const [suggested, setSuggested] = useState<Array<{id:number; name:string; price:number; image_url:string}>>([])
  const [suggestedOpen, setSuggestedOpen] = useState(false)
  const [acceptAll, setAcceptAll] = useState(false)
  const [consents, setConsents] = useState({ privacy: false, marketing: false, calls: false })
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [deliveryType, setDeliveryType] = useState<'courier'|'pickup'>('courier')
  const [address, setAddress] = useState('')
  const [needAssembly, setNeedAssembly] = useState(false)
  const [needUtilization, setNeedUtilization] = useState(false)
  const [addrQuery, setAddrQuery] = useState('')
  const [addrSuggests, setAddrSuggests] = useState<string[]>([])
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('cod')
  const [placing, setPlacing] = useState(false)
  const [errors, setErrors] = useState<{name?: boolean; phone?: boolean; privacy?: boolean; delivery?: boolean}>({})
  const [showFillModal, setShowFillModal] = useState(false)
  const [modulesOpenByKey, setModulesOpenByKey] = useState<Record<string, boolean>>({})
  const [moduleImages, setModuleImages] = useState<Record<number, string>>({})

  function toggleAcceptAll() {
    const next = !acceptAll
    setAcceptAll(next)
    setConsents({ privacy: next, marketing: next, calls: next })
  }

  // Адрес: дебаунс‑подсказки (Яндекс Геокодер)
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_YANDEX_API_KEY
    if (!addrQuery || addrQuery.length < 3 || !token) {
      setAddrSuggests([])
      return
    }
    setAddrLoading(true)
    const id = setTimeout(async () => {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(token as string)}&format=json&geocode=${encodeURIComponent(addrQuery)}&lang=ru_RU&results=7`
        const resp = await fetch(url)
        if (!resp.ok) throw new Error('suggest error')
        const data = await resp.json()
        const members = data?.response?.GeoObjectCollection?.featureMember || []
        const list = members.map((m: any) => {
          const g = m?.GeoObject
          const name = g?.name || ''
          const desc = g?.description || ''
          return [desc, name].filter(Boolean).join(', ')
        }).filter((s: string) => !!s)
        setAddrSuggests(list)
        setAddrOpen(true)
      } catch (e) {
        setAddrSuggests([])
      } finally {
        setAddrLoading(false)
      }
    }, 300)
    return () => clearTimeout(id)
  }, [addrQuery])

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const productIds = Array.from(new Set(items.map(i => i.id)))
        if (productIds.length === 0) { setSuggested([]); return }
        // 1) Получаем related_products для товаров в корзине
        const { data: rel, error } = await supabase
          .from('products')
          .select('id, related_products')
          .in('id', productIds)
        if (error) throw error
        const ids = Array.from(new Set((rel||[]).flatMap(r => (r as any).related_products || [])))
        if (ids.length === 0) { setSuggested([]); return }
        // 2) Загружаем сами товары
        const { data: prods, error: err2 } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', ids)
          .limit(20)
        if (err2) throw err2
        setSuggested((prods as any) || [])
      } catch (e) {
        console.error('suggestions load error', e)
      }
    }
    loadSuggestions()
  }, [items])

  // Подгружаем изображения модулей для тех, у кого они отсутствуют в корзине
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set(
          items.flatMap((it) => {
            const mods = (it.options as any)?.modules || []
            return mods.filter((m: any) => m && !m.image_url && m.id).map((m: any) => Number(m.id))
          })
        )) as number[]
        if (ids.length === 0) return
        const { data, error } = await supabase
          .from('product_modules')
          .select('id, image_url')
          .in('id', ids)
        if (error) throw error
        const map: Record<number, string> = {}
        ;(data || []).forEach((row: any) => { if (row?.id && row?.image_url) map[row.id] = row.image_url })
        if (Object.keys(map).length > 0) setModuleImages((prev) => ({ ...prev, ...map }))
      } catch (e) {
        // ignore
      }
    })()
  }, [items])

  async function placeOrder() {
    if (placing) return
    // валидация с подсветкой
    const nextErrors = {
      name: !contact.name,
      phone: !contact.phone,
      privacy: !consents.privacy,
      delivery: !deliveryType,
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || nextErrors.privacy || nextErrors.delivery) {
      setShowFillModal(true)
      return
    }
    // Адрес не обязателен: если пусто и выбран курьер, отправим без адреса — уточним по звонку
    try {
      setPlacing(true)
      const payload = {
        contact,
        items: items.map(it => ({ id: it.id, name: it.name, qty: it.qty, price: it.price, color: it.color || null, options: it.options || null })),
        total,
        delivery: { type: deliveryType, address: address || null, needAssembly, needUtilization },
        payment: { method: paymentMethod },
      }
      const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await resp.json()
      if (!resp.ok || !data?.success) throw new Error(data?.error || 'Order error')
      clear()
      router.push(`/order/success?order=${data.id}`)
    } catch (e: any) {
      alert(e?.message || 'Не удалось оформить заказ')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Корзина</h1>
      {items.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="mb-3">Ваша корзина пуста</div>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white">Перейти в каталог →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
            {items.map((it) => {
              const key = `${it.id}|${it.color || ''}|${it.options ? JSON.stringify(it.options) : ''}`
              return (
                <div key={key} className="bg-white border rounded-xl p-4 flex gap-4">
                  <img src={it.image_url || '/placeholder.jpg'} alt={it.name} className="w-24 h-24 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2">{it.name}</div>
                    {it.color && <div className="text-xs text-gray-500 mt-0.5">Цвет: {it.color}</div>}
                    {/* Опции */}
                    {it.options && (
                      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {it.options.filling && <div>Наполнение: {it.options.filling.name} {it.options.filling.delta_price ? `(+${it.options.filling.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.hinge && <div>Петли: {it.options.hinge.name} {it.options.hinge.delta_price ? `(+${it.options.hinge.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.drawer && <div>Ящики: {it.options.drawer.name} {it.options.drawer.delta_price ? `(+${it.options.drawer.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {it.options.lighting && <div>Подсветка: {it.options.lighting.name} {it.options.lighting.delta_price ? `(+${it.options.lighting.delta_price.toLocaleString('ru-RU')} ₽)` : ''}</div>}
                        {/* Модули (если пользователь добавлял) */}
                        {Array.isArray((it.options as any).modules) && (it.options as any).modules.length > 0 && (
                          <div className="pt-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-700">Модули</div>
                              <button
                                type="button"
                                className="text-[11px] px-2 py-1 rounded-full border hover:bg-gray-50"
                                onClick={() => setModulesOpenByKey(v => ({ ...v, [key]: !v[key] }))}
                              >
                                {modulesOpenByKey[key] ? 'Свернуть' : 'Развернуть'}
                              </button>
                            </div>
                            {/* Превью в одну строку */}
                            {!modulesOpenByKey[key] && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(it.options as any).modules.slice(0,6).map((m: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700">
                                    <span className="truncate max-w-[140px]">{m.name}</span>
                                    {m.qty ? <span className="text-gray-500">×{m.qty}</span> : null}
                                  </span>
                                ))}
                                {(it.options as any).modules.length > 6 && (
                                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-500">+{(it.options as any).modules.length - 6}</span>
                                )}
                              </div>
                            )}
                            {/* Карточки модулей при раскрытии */}
                            {modulesOpenByKey[key] && (
                              <div className="mt-2 overflow-x-auto -mx-1 px-1">
                                <div className="flex gap-2">
                                  {(it.options as any).modules.map((m: any, idx: number) => (
                                    <div key={idx} className="w-[200px] flex-shrink-0 border rounded-lg bg-white overflow-hidden">
                                      <div className="relative w-full h-24 bg-gray-100">
                                        {(m.image_url || moduleImages[m.id as number]) ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={(m.image_url || moduleImages[m.id as number])} alt={m.name} className="w-full h-full object-cover" />
                                        ) : null}
                                      </div>
                                      <div className="p-2">
                                        <div className="font-medium text-sm truncate" title={m.name}>{m.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Количество: {m.qty || 1}</div>
                                        <div className="text-sm font-semibold mt-1">{(m.price * (m.qty || 1)).toLocaleString('ru-RU')} ₽</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button className="w-8 h-8 border rounded" onClick={() => updateQty(it.id, it.qty - 1, key)}>-</button>
                      <div className="px-2 text-sm">{it.qty}</div>
                      <button className="w-8 h-8 border rounded" onClick={() => updateQty(it.id, it.qty + 1, key)}>+</button>
                      <button className="ml-3 text-sm text-red-600" onClick={() => remove(it.id, key)}>Удалить</button>
                    </div>
                  </div>
                  <div className="text-right font-semibold">{(it.price * it.qty).toLocaleString('ru-RU')} ₽</div>
                </div>
              )
            })}
            <button className="text-sm text-gray-500 hover:text-black" onClick={clear}>Очистить корзину</button>

            {/* Рекомендации над формой */}
            {suggested.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">Вам может подойти</h2>
                  <button
                    className="text-gray-700 hover:text-black text-sm md:text-base flex items-center gap-2 select-none"
                    onClick={() => setSuggestedOpen(v => !v)}
                  >
                    {suggestedOpen ? 'Свернуть' : 'Развернуть'}
                    <span
                      className={`ml-0 inline-grid place-items-center w-6 h-6 rounded-full text-white bg-black shadow-sm ring-1 ring-black/10 transition-all duration-300 ${suggestedOpen ? 'rotate-180 scale-100 opacity-100' : 'scale-110 opacity-95 animate-pulse'}`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>
                </div>

                <div className={`transition-all duration-500 ease-in-out ${suggestedOpen ? 'opacity-0 -translate-y-1 h-0 max-h-0 overflow-hidden' : 'opacity-100 translate-y-0 h-auto'}`}>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="flex gap-3">
                      {(suggested.slice(0, 8)).map((p) => (
                        <a key={p.id} href={`/product/${p.id}`} className="block w-24 h-24 rounded-xl overflow-hidden bg-white border flex-shrink-0">
                          <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${suggestedOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}`}>
                  <ProductGrid
                    products={suggested as any}
                    horizontal
                    onAdd={(p) => add({ id: p.id as any, name: p.name as any, price: (p as any).price as any, image_url: (p as any).image_url as any }, 1)}
                  />
                </div>
              </div>
            )}

            {/* Заполните информацию о себе */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Заполните информацию о себе</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Имя"
                  value={contact.name}
                  onChange={e => { setContact({ ...contact, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: false }) }}
                />
                <input
                  className={`w-full border rounded-lg px-3 py-2 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="Телефон"
                  value={contact.phone}
                  onChange={e => { setContact({ ...contact, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: false }) }}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 sm:col-span-2"
                  placeholder="Почта"
                  value={contact.email}
                  onChange={e => setContact({ ...contact, email: e.target.value })}
                />
              </div>
              <div className="mt-4 text-sm text-gray-600">Чтобы оформить заказ, нам нужно разрешение на использование ваших данных:</div>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptAll} onChange={toggleAcceptAll} />
                  <span>Принять все</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.privacy} onChange={() => { setConsents(v => ({ ...v, privacy: !v.privacy })); if (errors.privacy) setErrors({ ...errors, privacy: false }) }} />
                  <span>
                    Согласен на обработку персональных данных на условиях Политики конфиденциальности
                    <span className="text-red-500"> *</span>
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.marketing} onChange={() => setConsents(v => ({ ...v, marketing: !v.marketing }))} />
                  <span>Согласен на получение рассылок рекламно-информационного характера</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={consents.calls} onChange={() => setConsents(v => ({ ...v, calls: !v.calls }))} />
                  <span>Согласен на получение массовых и автоматических звонков</span>
                </label>
              </div>
            </section>

            {/* Выберите способ доставки */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Выберите способ доставки</div>
              <div className="flex items-center gap-2 text-sm mb-4">
                <button type="button" className={`px-4 py-2 rounded-full border ${deliveryType==='courier' ? 'bg-black text-white border-black' : 'bg-white'}`} onClick={()=>setDeliveryType('courier')}>Курьер</button>
                <button type="button" className={`px-4 py-2 rounded-full border ${deliveryType==='pickup' ? 'bg-black text-white border-black' : 'bg-white'}`} onClick={()=>setDeliveryType('pickup')}>Самовывоз</button>
              </div>
              {deliveryType === 'courier' && (
                <div className="relative mb-4">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Адрес"
                    value={address}
                    onChange={e=>{ setAddress(e.target.value); setAddrQuery(e.target.value) }}
                    onFocus={()=>{ if (addrSuggests.length>0) setAddrOpen(true) }}
                    onBlur={()=> setTimeout(()=> setAddrOpen(false), 150)}
                  />
                  {addrOpen && (addrLoading || addrSuggests.length>0) && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-40 max-h-64 overflow-auto">
                      {addrLoading && <div className="px-3 py-2 text-sm text-gray-500">Загрузка…</div>}
                      {!addrLoading && addrSuggests.map((s) => (
                        <button
                          type="button"
                          key={s}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onMouseDown={(e)=> e.preventDefault()}
                          onClick={()=>{ setAddress(s); setAddrQuery(s); setAddrOpen(false) }}
                        >
                          {s}
                        </button>
                      ))}
                      {!addrLoading && addrSuggests.length===0 && addrQuery.length>=3 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Ничего не найдено</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needAssembly} onChange={()=>setNeedAssembly(v=>!v)} />
                  <span>Необходима сборка мебели</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needUtilization} onChange={()=>setNeedUtilization(v=>!v)} />
                  <span>Необходима утилизация мебели</span>
                </label>
              </div>
            </section>

            {/* Выберите способ оплаты */}
            <section className="bg-white border rounded-xl p-5">
              <div className="text-lg font-semibold mb-4">Выберите способ оплаты</div>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                  <span>Наличными при получении</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='yap'} onChange={()=>setPaymentMethod('yap')} />
                  <span>Оплата Яндекс Пэй</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} />
                  <span>Оплата картой онлайн или через СБП</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='invoice'} onChange={()=>setPaymentMethod('invoice')} />
                  <span>Безналичная оплата по счёту</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='sberpay'} onChange={()=>setPaymentMethod('sberpay')} />
                  <span>Оплатить онлайн через SberPay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='split'} onChange={()=>setPaymentMethod('split')} />
                  <span>Частями с Яндекс Сплит</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pay" checked={paymentMethod==='installment'} onChange={()=>setPaymentMethod('installment')} />
                  <span>В рассрочку</span>
                </label>
              </div>
            </section>

            
          </div>
          <div className="bg-white border rounded-xl p-5 h-max sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div>Итого</div>
              <div className="text-2xl font-bold">{total.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div className="text-sm text-gray-500 mb-4">Доставка и сборка будут рассчитаны менеджером после подтверждения заказа.</div>
            <button onClick={placeOrder} disabled={placing} className="block w-full text-center py-3 rounded-full bg-black text-white font-semibold disabled:opacity-60">
              {placing ? 'Оформляем…' : 'Оформить заказ'}
            </button>
            <div className="mt-3 text-xs text-gray-500">Нажимая кнопку, вы принимаете условия оферты.</div>
          </div>
        </div>
      )}

      {/* Модалка: заполните поля */}
      {showFillModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center" role="dialog" aria-modal>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-[92%] p-5 text-center">
            <div className="text-lg font-semibold mb-2">Заполните, пожалуйста, поля</div>
            <div className="text-sm text-gray-600 mb-4">
              {errors.name && <div>— Имя</div>}
              {errors.phone && <div>— Телефон</div>}
              {errors.privacy && <div>— Согласие на обработку персональных данных</div>}
              {errors.delivery && <div>— Выберите способ доставки</div>}
            </div>
            <button className="px-5 py-2 rounded-full bg-black text-white" onClick={() => setShowFillModal(false)}>Понятно</button>
          </div>
        </div>
      )}
    </div>
  )
}


