'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  isOpen: boolean
  onClose: () => void
  imageUrl?: string
}

type KitchenType = 'straight' | 'corner' | 'p' | 'island'

export default function KitchenQuiz({ isOpen, onClose, imageUrl }: Props) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState<KitchenType | ''>('')
  const [dims, setDims] = useState<Record<string, string>>({})
  const [layout, setLayout] = useState('')
  // шаг «Стиль кухни» удалён
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const canNext = useMemo(() => {
    if (step === 1) return !!type
    if (step === 2) {
      if (type === 'straight') return !!dims.wall && !!dims.ceiling
      if (type === 'corner') return !!dims.wall1 && !!dims.wall2 && !!dims.ceiling
      if (type === 'p') return !!dims.wall1 && !!dims.wall2 && !!dims.wall3 && !!dims.ceiling
      if (type === 'island') return !!dims.wall && !!dims.island && !!dims.ceiling
    }
    if (step === 3) return !!layout
    if (step === 4) return !!name && /^\+?\d[\d\s\-()]{9,}$/.test(phone)
    return true
  }, [step, type, dims, layout, name, phone])

  const progress = useMemo(() => (step / 4) * 100, [step])

  const handlePhone = (v: string) => {
    // примитивная маска +7 (xxx) xxx-xx-xx
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let out = digits
    if (digits.length > 1) out = `+${digits[0]} ` + digits.slice(1)
    if (digits.length >= 4) out = `+${digits[0]} (${digits.slice(1,4)}) ` + digits.slice(4)
    if (digits.length >= 7) out = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-` + digits.slice(7)
    if (digits.length >= 9) out = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-` + digits.slice(9,11)
    setPhone(out)
  }

  const submit = async () => {
    const payload = {
      type,
      dimensions: dims,
      layout,
      // style удалён
      name,
      phone,
      created_at: new Date().toISOString(),
    }
    try {
      const res = await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        alert('Спасибо! Мы получили вашу заявку.')
        onClose()
        setStep(1)
        setType('')
        setDims({})
        setLayout('')
        setName('')
        setPhone('')
      } else {
        const err = data?.error || 'Ошибка отправки. Попробуйте позже'
        alert(err)
      }
    } catch (e) {
      alert('Ошибка сети. Попробуйте позже')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-[92%] max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        {/* Верхнее изображение товара */}
        {imageUrl && (
          <div className="w-full h-40 sm:h-56 bg-gray-100 overflow-hidden">
            <img src={imageUrl} alt="Товар" className="w-full h-full object-cover" />
          </div>
        )}
        {/* Прогресс */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-black transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Рассчитать под мои размеры</h3>
            <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="font-semibold">1. Тип кухни</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Choice label="Прямая" active={type==='straight'} onClick={()=> setType('straight')} />
                  <Choice label="Угловая" active={type==='corner'} onClick={()=> setType('corner')} />
                  <Choice label="П-образная" active={type==='p'} onClick={()=> setType('p')} />
                  <Choice label="Островная" active={type==='island'} onClick={()=> setType('island')} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="font-semibold">2. Размеры помещения</div>
                {type === 'straight' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Ширина стены (см)" value={dims.wall || ''} onChange={(v)=> setDims({ ...dims, wall: v })} />
                    <Input label="Высота потолков (см)" value={dims.ceiling || ''} onChange={(v)=> setDims({ ...dims, ceiling: v })} />
                  </div>
                )}
                {type === 'corner' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input label="Ширина 1-й стены (см)" value={dims.wall1 || ''} onChange={(v)=> setDims({ ...dims, wall1: v })} />
                    <Input label="Ширина 2-й стены (см)" value={dims.wall2 || ''} onChange={(v)=> setDims({ ...dims, wall2: v })} />
                    <Input label="Высота потолков (см)" value={dims.ceiling || ''} onChange={(v)=> setDims({ ...dims, ceiling: v })} />
                  </div>
                )}
                {type === 'p' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input label="Ширина 1-й стены (см)" value={dims.wall1 || ''} onChange={(v)=> setDims({ ...dims, wall1: v })} />
                    <Input label="Ширина 2-й стены (см)" value={dims.wall2 || ''} onChange={(v)=> setDims({ ...dims, wall2: v })} />
                    <Input label="Ширина 3-й стены (см)" value={dims.wall3 || ''} onChange={(v)=> setDims({ ...dims, wall3: v })} />
                    <Input label="Высота потолков (см)" value={dims.ceiling || ''} onChange={(v)=> setDims({ ...dims, ceiling: v })} />
                  </div>
                )}
                {type === 'island' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input label="Ширина стены (см)" value={dims.wall || ''} onChange={(v)=> setDims({ ...dims, wall: v })} />
                    <Input label="Расстояние до острова (см)" value={dims.island || ''} onChange={(v)=> setDims({ ...dims, island: v })} />
                    <Input label="Высота потолков (см)" value={dims.ceiling || ''} onChange={(v)=> setDims({ ...dims, ceiling: v })} />
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="font-semibold">3. Планировка</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Окно по центру','Окно слева','Окно справа','Дверь рядом','Не знаю'].map((l) => (
                    <Choice key={l} label={l} active={layout===l} onClick={()=> setLayout(l)} />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4-contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="font-semibold">4. Контакты</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Имя" value={name} onChange={setName} />
                  <Input label="Телефон" value={phone} onChange={handlePhone} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Навигация */}
          <div className="mt-6 flex items-center justify-between">
            <button disabled={step===1} onClick={()=> setStep((s)=> Math.max(1, s-1))} className="px-4 py-2 rounded-full border disabled:opacity-40">Назад</button>
            {step<4 ? (
              <button disabled={!canNext} onClick={()=> setStep((s)=> Math.min(4, s+1))} className="px-5 py-2 rounded-full bg-black text-white disabled:opacity-40">Далее</button>
            ) : (
              <button disabled={!canNext} onClick={submit} className="px-5 py-2 rounded-full bg-black text-white disabled:opacity-40">Отправить</button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`border rounded-xl px-4 py-3 shadow-sm hover:shadow transition-all text-sm ${active ? 'ring-2 ring-black' : ''}`}>{label}</button>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/30" value={value} onChange={(e)=> onChange(e.target.value)} />
    </label>
  )
}


