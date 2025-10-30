'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface GameModalProps {
  open: boolean
  onClose: () => void
}

export default function GameModal({ open, onClose }: GameModalProps) {
  const { data: session } = useSession()
  const [spinning, setSpinning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLDivElement>(null)
  const [rerollsLeft, setRerollsLeft] = useState<number>(2)
  const [successOpen, setSuccessOpen] = useState(false)
  const [blockedOpen, setBlockedOpen] = useState(false)
  const [hasPrize, setHasPrize] = useState(false)

  useEffect(() => {
    if (!open) { setSpinning(false); setFinished(false); setSelectedPrize(null); setRerollsLeft(2); setBlockedOpen(false); setHasPrize(false) }
    else {
      const phone = (session as any)?.phone
      if (phone) {
        fetch('/api/game/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
          .then(r => r.json()).then(j => {
            if (j?.hasPrize) { setHasPrize(true); setBlockedOpen(true) }
          }).catch(() => {})
      }
    }
  }, [open, session])

  if (!open) return null

  const start = () => {
    if (spinning || finished || hasPrize) return
    setSpinning(true)
    const wheel = wheelRef.current
    if (!wheel) return
    // 4 секции (по 90°). Стрелка указывает на 0°. Вычисляем случайный угол остановки
    const base = 360 * 4
    const randomAngle = Math.random() * 360
    const stopAt = randomAngle
    // Победный сектор тот, что оказывается под верхним указателем (0°).
    // Колесо вращается по часовой, координата под указателем = (360 - stopAt) % 360.
    const pointing = ((360 - stopAt) % 360 + 360) % 360
    // Сектора соответствуют отрисовке SVG (по часовой):
    // 0–90: Скидка 3%, 90–180: Скидка 5%, 180–270: Замер, 270–360: Дизайнер.
    let prize: string
    if (pointing >= 0 && pointing < 90) prize = 'Скидка 3%'
    else if (pointing >= 90 && pointing < 180) prize = 'Скидка 5%'
    else if (pointing >= 180 && pointing < 270) prize = 'Замер за 1₽'
    else prize = 'Дизайнер 0₽'
    setSelectedPrize(prize)
    wheel.style.transition = 'transform 3.2s cubic-bezier(0.19, 1, 0.22, 1)'
    requestAnimationFrame(() => {
      wheel.style.transform = `rotate(${base + stopAt}deg)`
    })
    setTimeout(() => {
      setSpinning(false)
      setFinished(true)
      // простые конфетти
      const holder = confettiRef.current
      if (!holder) return
      holder.innerHTML = ''
      for (let i = 0; i < 80; i++) {
        const s = document.createElement('span')
        s.className = 'confetti-piece'
        s.style.left = Math.random() * 100 + '%'
        s.style.animationDelay = (Math.random() * 0.2) + 's'
        s.style.background = ['#000','#111','#333','#666','#ffcc00','#ff5a5f'][i % 6]
        holder.appendChild(s)
      }
      setTimeout(() => { if (holder) holder.innerHTML = '' }, 1600)
    }, 3300)
  }

  const submit = async () => {
    try {
      const phone = (session as any)?.phone || null
      const res = await fetch('/api/game/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, prize: selectedPrize }) })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Ошибка')
      setSuccessOpen(true)
    } catch (e: any) {
      alert(e?.message || 'Не удалось сохранить')
    }
  }

  const reroll = () => {
    if (spinning || rerollsLeft <= 0) return
    setFinished(false)
    setSelectedPrize(null)
    setRerollsLeft((n) => Math.max(0, n - 1))
    // сброс позиции колеса
    const wheel = wheelRef.current
    if (wheel) {
      wheel.style.transition = 'transform 0s'
      wheel.style.transform = 'rotate(0deg)'
    }
  }

  return (
    <div className="fixed inset-0 z-[70] px-3 md:px-0 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl">
        {/* неоновая аура */}
        <div className="absolute -inset-1 rounded-[28px] bg-[conic-gradient(from_180deg,rgba(255,255,255,.7),rgba(255,221,87,.8),rgba(255,255,255,.7))] opacity-50 blur-2xl" />
        <div className="relative bg-white/85 backdrop-blur-xl rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,.25)] ring-1 ring-black/10 overflow-hidden">
          {/* декоративная шапка */}
          <div className="h-2 w-full bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300" />
          <div className="p-6 md:p-8">
        <div className="flex items-center justify-end mb-5">
          <button onClick={onClose} aria-label="Закрыть" className="w-8 h-8 rounded-full grid place-items-center hover:bg-gray-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* колесо */}
        <div className="mx-auto my-4 w-[18rem] h-[18rem] relative">
          {/* стрелка‑указатель */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 select-none">
            <div className="relative w-10 h-10">
              <div className="absolute inset-x-0 top-2 mx-auto w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-black drop-shadow-lg" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-8 h-8 rounded-full bg-yellow-300 ring-2 ring-black/10 shadow-lg animate-pulse" />
            </div>
            <div className="text-[10px] text-center text-black/70 mt-1">СТОП</div>
          </div>
          {/* диск */}
          <div ref={wheelRef} className="rounded-full w-full h-full shadow-[inset_0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-black/10 overflow-hidden relative" style={{ transition: 'transform 0s', transform: 'rotate(0deg)' }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffe3ec"/>
                  <stop offset="100%" stopColor="#ffc2d1"/>
                </linearGradient>
                <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff3bf"/>
                  <stop offset="100%" stopColor="#ffe066"/>
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d3f9d8"/>
                  <stop offset="100%" stopColor="#b2f2bb"/>
                </linearGradient>
                <linearGradient id="g4" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#d0ebff"/>
                  <stop offset="100%" stopColor="#a5d8ff"/>
                </linearGradient>
              </defs>
              {/* четыре сектора */}
              <path d="M50,50 L50,0 A50,50 0 0,1 100,50 Z" fill="url(#g1)"/>
              <path d="M50,50 L100,50 A50,50 0 0,1 50,100 Z" fill="url(#g2)"/>
              <path d="M50,50 L50,100 A50,50 0 0,1 0,50 Z" fill="url(#g3)"/>
              <path d="M50,50 L0,50 A50,50 0 0,1 50,0 Z" fill="url(#g4)"/>
              {/* подписи */}
              <g fontSize="6" fontWeight="700" fill="#111">
                <text x="72" y="30" textAnchor="middle">Скидка 3%</text>
                <text x="72" y="72" textAnchor="middle">Скидка 5%</text>
                <text x="28" y="72" textAnchor="middle">Замер за 1₽</text>
                <text x="28" y="30" textAnchor="middle">Дизайнер 0₽</text>
              </g>
            </svg>
            {/* центральная кнопка/хаб */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className={`w-20 h-20 rounded-full bg-white shadow-xl ring-1 ring-black/10 ${spinning ? 'animate-pulse' : ''}`}/>
            </div>
            {/* деления по кругу убраны по просьбе клиента */}
            {/* слабое вращающееся свечение */}
            <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(255,241,118,.25),rgba(255,241,118,0)_60%)] animate-[spin_6s_linear_infinite]" />
          </div>
        </div>
        <div ref={confettiRef} className="pointer-events-none absolute inset-0 overflow-hidden"></div>

        {!finished ? (
          <button onClick={start} className="w-full py-3 rounded-[50px] bg-black text-white font-medium shadow-lg hover:shadow-xl transition-shadow">Играть</button>
        ) : (
          <div className="space-y-3">
            <div className="text-center font-semibold text-lg">Вы выиграли: {selectedPrize}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={reroll} disabled={rerollsLeft <= 0} className={`py-3 rounded-[50px] border border-black font-medium ${rerollsLeft>0 ? 'bg-white/70 text-black hover:bg-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{rerollsLeft>0 ? `Крутить ещё раз (осталось ${rerollsLeft})` : 'Крутить ещё раз (нет попыток)'}</button>
              {(session as any)?.phone ? (
                <button onClick={submit} className="py-3 rounded-[50px] bg-black text-white font-medium shadow-lg hover:shadow-xl transition-shadow">Забрать приз</button>
              ) : (
                <button onClick={() => window.dispatchEvent(new Event('arteco:open-auth'))} className="py-3 rounded-[50px] border border-black text-black font-medium bg-white/70 hover:bg-white transition-colors">Войти, чтобы забрать приз</button>
              )}
            </div>
            <div className="text-xs text-gray-500 text-center">Приз будет закреплён за вашим аккаунтом.</div>
          </div>
        )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: 20%;
          width: 6px;
          height: 10px;
          opacity: 0.9;
          animation: confetti-fall 1.4s ease-out forwards;
          transform: translateY(-20px) rotate(0deg);
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(80vh) rotate(540deg); }
        }
      `}</style>
      {successOpen && (
        <div className="fixed inset-0 z-[80] px-3 md:px-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSuccessOpen(false); onClose() }} />
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 rounded-[22px] bg-[conic-gradient(from_180deg,rgba(255,255,255,.7),rgba(168,255,149,.9),rgba(255,255,255,.7))] opacity-50 blur-xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 p-8 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-pink-100 text-pink-600 grid place-items-center shadow">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.35-9.192-6.828C.364 11.728.364 8.272 2.808 5.828a4.5 4.5 0 016.364 0L12 8.657l2.828-2.829a4.5 4.5 0 016.364 6.364C18.716 16.65 12 21 12 21z"/></svg>
              </div>
              <div className="text-xl font-semibold mb-1">Приз закреплён!</div>
              <div className="text-sm text-gray-600 mb-6">Вы получили: {selectedPrize}. Мы обязательно учтём его при оформлении заказа ❤️</div>
              <button onClick={() => { setSuccessOpen(false); onClose() }} className="w-full py-3 rounded-[50px] bg-black text-white font-medium shadow-lg hover:shadow-xl transition-shadow">Отлично</button>
            </div>
          </div>
        </div>
      )}
      {blockedOpen && (
        <div className="fixed inset-0 z-[85] px-3 md:px-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setBlockedOpen(false); onClose() }} />
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 rounded-[22px] bg-[conic-gradient(from_180deg,rgba(255,255,255,.7),rgba(255,205,86,.9),rgba(255,255,255,.7))] opacity-50 blur-xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 p-8 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 grid place-items-center shadow">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
              </div>
              <div className="text-lg font-semibold mb-2">Извините, но вы уже выиграли приз 🙂</div>
              <div className="text-sm text-gray-600 mb-6">Обязательно используйте его при оформлении товара. Желаем ARTпадного шопинга!</div>
              <button onClick={() => { setBlockedOpen(false); onClose() }} className="w-full py-3 rounded-[50px] bg-black text-white font-medium shadow-lg hover:shadow-xl transition-shadow">Понятно</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


