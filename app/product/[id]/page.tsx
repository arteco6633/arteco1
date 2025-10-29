'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import KitchenQuiz from '@/components/KitchenQuiz'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string
  images?: string[] | null
  colors?: string[] | null
  fillings?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  hinges?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  drawers?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  lighting?: Array<{ name: string; description?: string; image_url?: string; delta_price?: number }> | null
  specs?: { 
    body_material?: string
    facade_material?: string
    additional?: string
    handles?: string
    handle_material?: string
    back_wall_material?: string
    delivery_option?: string
    feet?: string
    country?: string
  } | null
  schemes?: string[] | null
  videos?: string[] | null
  category_id: number
  is_featured: boolean
  is_new: boolean
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function ProductPage() {
  const params = useParams()
  const id = params?.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedFillingIdx, setSelectedFillingIdx] = useState<number | null>(null)
  const [selectedHingeIdx, setSelectedHingeIdx] = useState<number | null>(null)
  const leftMainImageRef = useRef<HTMLDivElement | null>(null)
  const [syncedRightHeight, setSyncedRightHeight] = useState<number>(0)
  const [selectedDrawerIdx, setSelectedDrawerIdx] = useState<number | null>(null)
  const [selectedLightingIdx, setSelectedLightingIdx] = useState<number | null>(null)
  const finalPrice = useMemo(() => {
    if (!product) return 0
    const base = Number(product.price) || 0
    const fill = (product.fillings && selectedFillingIdx != null && product.fillings[selectedFillingIdx]?.delta_price) || 0
    const hinge = (product.hinges && selectedHingeIdx != null && product.hinges[selectedHingeIdx]?.delta_price) || 0
    const drawer = (product.drawers && selectedDrawerIdx != null && product.drawers[selectedDrawerIdx]?.delta_price) || 0
    const lighting = (product.lighting && selectedLightingIdx != null && product.lighting[selectedLightingIdx]?.delta_price) || 0
    return base + fill + hinge + drawer + lighting
  }, [product, selectedFillingIdx, selectedHingeIdx, selectedDrawerIdx, selectedLightingIdx])
  const [openFilling, setOpenFilling] = useState(true)
  const [openHinge, setOpenHinge] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openLighting, setOpenLighting] = useState(false)
  const [activeTab, setActiveTab] = useState<'schemes' | 'specs' | 'videos'>('schemes')
  const [related, setRelated] = useState<any[]>([])
  // Квиз «Рассчитать под мои размеры»
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [quizStep, setQuizStep] = useState<1 | 2 | 3>(1)
  const [quizData, setQuizData] = useState<{ shape?: 'straight' | 'g' | 'island'; leftWidth?: string; rightWidth?: string; wallWidth?: string; ceiling?: string }>({})

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  useEffect(() => {
    const updateHeight = () => {
      const h = leftMainImageRef.current?.offsetHeight || 0
      setSyncedRightHeight(h)
    }
    updateHeight()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && leftMainImageRef.current) {
      ro = new ResizeObserver(() => updateHeight())
      ro.observe(leftMainImageRef.current)
    } else {
      window.addEventListener('resize', updateHeight)
    }
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  useEffect(() => {
    const loadRelated = async () => {
      if (!product?.category_id) return
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(8)
      if (!error && data && data.length > 0) {
        setRelated(data)
        return
      }
      // Фоллбек: если по категории пусто/ошибка, показываем любые товары
      const { data: fallback } = await supabase
        .from('products')
        .select('*')
        .neq('id', product.id)
        .limit(8)
      setRelated(fallback || [])
    }
    loadRelated()
  }, [product?.category_id, product?.id])

  async function loadProduct() {
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!productData) {
        setLoading(false)
        return
      }

      setProduct(productData)

      // Загружаем категорию
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', productData.category_id)
        .single()

      setCategory(categoryData)
    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
    } finally {
      setLoading(false)
    }
  }

  function addToCart() {
    // TODO: Реализовать добавление в корзину
    alert(`Добавлено в корзину: ${quantity} шт.`)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Товар не найден</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/catalog/${category.slug}`} className="hover:text-gray-700">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Галерея изображений — миниатюры слева, большое фото справа */}
          <div>
            {/* Главное фото с кнопками навигации */}
            <div ref={leftMainImageRef} className="rounded-lg overflow-hidden shadow-lg relative aspect-square">
            <img
                  src={(product.images && product.images[activeImageIdx]) || (product.images && product.images[0]) || product.image_url || '/placeholder.jpg'}
              alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.images && product.images.length > 1 && (
                  <>
                    {/* Кнопка "Назад" */}
                    {activeImageIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveImageIdx(activeImageIdx - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      >
                        ←
                      </button>
                    )}
                    {/* Кнопка "Вперёд" */}
                    {activeImageIdx < product.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveImageIdx(activeImageIdx + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      >
                        →
                      </button>
                    )}
                  </>
                )}
            </div>

            {/* Миниатюры под главным фото */}
            {product.images && product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.slice(0,10).map((url, idx) => (
                  <button key={idx} type="button" onClick={() => setActiveImageIdx(idx)} className={`rounded overflow-hidden ring-2 ${activeImageIdx===idx ? 'ring-black' : 'ring-transparent'}`}>
                    <img src={url} alt={`Фото ${idx+1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="relative flex flex-col overflow-hidden" style={{ height: syncedRightHeight ? `${syncedRightHeight}px` : undefined }}>
            <div className="flex-1 overflow-y-auto">
            {category && (
              <Link
                href={`/catalog/${category.slug}`}
                className="inline-block text-black hover:underline mb-2"
              >
                ← {category.name}
              </Link>
            )}

            <h1 className="text-4xl font-bold mb-2 leading-tight">{product.name}</h1>

            {product.description && (
              <>
                <p className="text-gray-600 text-lg leading-snug mb-1">{product.description}</p>
                <div className="text-4xl font-bold text-black mt-1 mb-1">
                  {finalPrice.toLocaleString('ru-RU')} ₽
                </div>
              </>
            )}

            <div className="flex gap-2 mb-6">
              {product.is_new && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  NEW
                </span>
              )}
              {product.is_featured && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ Рекомендуем
                </span>
              )}
            </div>

            {/* Блок с опциями и кнопкой */}
            <div className="bg-gray-50 rounded-lg p-3">

              {/* Свотчи цветов */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Цвета</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.colors.map((c, idx) => (
                      <span key={idx} className="w-6 h-6 rounded-full border border-black/10" style={{ background: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Варианты наполнений — Аккордеон */}
              {product.fillings && product.fillings.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFilling(!openFilling)
                      if (!openFilling) { setOpenHinge(false); setOpenDrawer(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Вариант наполнения</span>
                    <span className="text-xl">{openFilling ? '−' : '+'}</span>
                  </button>
                  {openFilling && (
                    <div className="px-4 pb-4 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        {product.fillings.map((f, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedFillingIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedFillingIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              {f.image_url && <img src={f.image_url} className="w-28 h-28 rounded object-cover" />}
                              <div>
                                <div className="font-medium">{f.name}</div>
                                {typeof f.delta_price === 'number' && f.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600">{f.delta_price > 0 ? '+' : ''}{f.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                              </div>
                            </div>
                            {f.description && <div className="text-xs text-gray-500 mt-1">{f.description}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              )}

              {/* Опция петель — Аккордеон */}
              {product.hinges && product.hinges.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHinge(!openHinge)
                      if (!openHinge) { setOpenFilling(false); setOpenDrawer(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Петли</span>
                    <span className="text-xl">{openHinge ? '−' : '+'}</span>
                  </button>
                  {openHinge && (
                    <div className="px-4 pb-4 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        {product.hinges.map((h, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedHingeIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedHingeIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              {h.image_url && <img src={h.image_url} className="w-28 h-28 rounded object-cover" />}
                              <div>
                                <div className="font-medium">{h.name}</div>
                                {typeof h.delta_price === 'number' && h.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600">{h.delta_price > 0 ? '+' : ''}{h.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                              </div>
                            </div>
                            {h.description && <div className="text-xs text-gray-500 mt-1">{h.description}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ящики — Аккордеон */}
              {product.drawers && product.drawers.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDrawer(!openDrawer)
                      if (!openDrawer) { setOpenFilling(false); setOpenHinge(false); setOpenLighting(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Ящики</span>
                    <span className="text-xl">{openDrawer ? '−' : '+'}</span>
                  </button>
                  {openDrawer && (
                    <div className="px-4 pb-4 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        {product.drawers.map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDrawerIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedDrawerIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              {d.image_url && <img src={d.image_url} className="w-28 h-28 rounded object-cover" />}
                              <div>
                                <div className="font-medium">{d.name}</div>
                                {typeof d.delta_price === 'number' && d.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600">{d.delta_price > 0 ? '+' : ''}{d.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                              </div>
                            </div>
                            {d.description && <div className="text-xs text-gray-500 mt-1">{d.description}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Подсветка — Аккордеон */}
              {product.lighting && product.lighting.length > 0 && (
                <div className="mb-2 border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenLighting(!openLighting)
                      if (!openLighting) { setOpenFilling(false); setOpenHinge(false); setOpenDrawer(false) }
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold">Подсветка</span>
                    <span className="text-xl">{openLighting ? '−' : '+'}</span>
                  </button>
                  {openLighting && (
                    <div className="px-4 pb-4 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        {product.lighting.map((l, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedLightingIdx(idx)}
                            className={`text-left p-3 rounded-lg border hover:bg-gray-50 ${selectedLightingIdx===idx ? 'border-black' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              {l.image_url && <img src={l.image_url} className="w-28 h-28 rounded object-cover" />}
                              <div>
                                <div className="font-medium">{l.name}</div>
                                {typeof l.delta_price === 'number' && l.delta_price !== 0 && (
                                  <div className="text-sm text-gray-600">{l.delta_price > 0 ? '+' : ''}{l.delta_price?.toLocaleString('ru-RU')} ₽</div>
                                )}
                              </div>
                            </div>
                            {l.description && <div className="text-xs text-gray-500 mt-1">{l.description}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              )}

                </div>
              </div>

            {/* Низ блока: количество и кнопка, закреплены вне скролла */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Добавить в избранное"
                  onClick={() => alert('Добавлено в избранное')}
                  className="w-10 h-10 rounded-full border border-black text-black hover:bg-black/5 transition-colors flex items-center justify-center"
                >
                  ♥
                </button>
              </div>
              <button
                onClick={addToCart}
                className="px-8 py-3 bg-black text-white rounded-[50px] hover:bg-black/80 transition-colors font-semibold"
              >
                В корзину
              </button>
              <button
                type="button"
                onClick={() => { setIsCalcOpen(true); setQuizStep(1) }}
                className="px-8 py-3 border border-black text-black rounded-[50px] hover:bg-black/5 transition-colors font-semibold"
              >
                Рассчитать под мои размеры
              </button>
            </div>
          </div>

            {/* Характеристики перенесены во вкладку ниже */}
            </div>


        {/* Вкладки: Размеры / Характеристики */}
        <section className="mt-12 w-full">
          <div className="flex gap-2 border-b mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('schemes')}
              className={`px-4 py-2 -mb-[1px] border-b-2 ${activeTab==='schemes' ? 'border-black font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Размеры
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 -mb-[1px] border-b-2 ${activeTab==='specs' ? 'border-black font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Характеристики
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 -mb-[1px] border-b-2 ${activeTab==='videos' ? 'border-black font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Видео кухни
            </button>
          </div>

          {activeTab === 'schemes' && (
            <div className="w-full space-y-6">
              {(product.schemes && product.schemes.length > 0) ? (
                product.schemes.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-full rounded-lg overflow-hidden border hover:shadow-lg bg-white transition-shadow">
                    <img src={url} alt={`Схема ${idx+1}`} className="w-full object-contain bg-white" style={{ maxHeight: '700px' }} />
                  </a>
                ))
              ) : (
                <div className="text-gray-500">Схемы отсутствуют</div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              {product.specs?.body_material && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Материал корпуса</span>
                  <span>{product.specs.body_material}</span>
                </div>
              )}
              {product.specs?.facade_material && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Материал фасадов</span>
                  <span>{product.specs.facade_material}</span>
                </div>
              )}
              {product.specs?.additional && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Дополнительно</span>
                  <span>{product.specs.additional}</span>
                </div>
              )}
              {product.specs?.handles && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Ручки</span>
                  <span>{product.specs.handles}</span>
                </div>
              )}
              {product.specs?.handle_material && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Материал ручек</span>
                  <span>{product.specs.handle_material}</span>
                </div>
              )}
              {product.specs?.back_wall_material && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Материал задней стенки</span>
                  <span>{product.specs.back_wall_material}</span>
                </div>
              )}
              {product.specs?.delivery_option && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Вариант доставки</span>
                  <span>{product.specs.delivery_option}</span>
                </div>
              )}
              {product.specs?.feet && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Подпятники</span>
                  <span>{product.specs.feet}</span>
                </div>
              )}
              {product.specs?.country && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold block mb-1">Страна производства</span>
                  <span>{product.specs.country}</span>
                </div>
              )}
              {!product.specs || Object.keys(product.specs).length === 0 && (
                <div className="col-span-full text-gray-500 text-center py-8">Характеристики отсутствуют</div>
              )}
            </div>
          )}
          {activeTab === 'videos' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="w-full md:col-span-5 flex items-start justify-center">
                {(product.videos && product.videos.length > 0) ? (
                  <div className="w-full rounded-lg overflow-hidden">
                    <video
                      src={product.videos[0]}
                      className="w-full h-[70vh] object-cover bg-transparent"
                      autoPlay
                      muted
                      playsInline
                      loop
                      controls
                      poster={product.images?.[0] || product.image_url}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">Видео отсутствуют</div>
                )}
              </div>

              <div className="md:col-span-7 md:sticky md:top-24 max-h-[70vh] overflow-auto pr-1">
                <h3 className="text-lg font-semibold mb-4">Характеристики</h3>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
                  {product.specs?.body_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал корпуса</span><span>{product.specs.body_material}</span></div>
                  )}
                  {product.specs?.facade_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал фасадов</span><span>{product.specs.facade_material}</span></div>
                  )}
                  {product.specs?.additional && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Дополнительно</span><span>{product.specs.additional}</span></div>
                  )}
                  {product.specs?.handles && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Ручки</span><span>{product.specs.handles}</span></div>
                  )}
                  {product.specs?.handle_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал ручек</span><span>{product.specs.handle_material}</span></div>
                  )}
                  {product.specs?.back_wall_material && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Материал задней стенки</span><span>{product.specs.back_wall_material}</span></div>
                  )}
                  {product.specs?.delivery_option && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Вариант доставки</span><span>{product.specs.delivery_option}</span></div>
                  )}
                  {product.specs?.feet && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Подпятники</span><span>{product.specs.feet}</span></div>
                  )}
                  {product.specs?.country && (
                    <div className="p-3 bg-gray-50 rounded-lg"><span className="font-semibold block mb-1">Страна производства</span><span>{product.specs.country}</span></div>
                  )}
                  {!product.specs || Object.keys(product.specs).length === 0 && (
                    <div className="text-gray-500">Характеристики отсутствуют</div>
                  )}
            </div>
          </div>
        </div>
          )}
        </section>

        <KitchenQuiz isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} imageUrl={product?.images?.[0] || (product as any)?.image_url || ''} />

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Вам понравится</h2>
            <ProductGrid products={related as any} />
          </section>
        )}

      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 ARTECO. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}


