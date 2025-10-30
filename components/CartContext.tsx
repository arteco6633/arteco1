'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type CartItem = {
  id: number
  name: string
  price: number
  image_url?: string | null
  qty: number
  // Опциональные характеристики
  color?: string | null
  options?: Record<string, any> | null
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (id: number, key?: string) => void
  updateQty: (id: number, qty: number, key?: string) => void
  clear: () => void
  count: number
  total: number
  open: boolean
  setOpen: (v: boolean) => void
}

const CartContext = createContext<CartState | null>(null)

const STORAGE_KEY = 'arteco_cart_v1'

function makeKey(item: CartItem | Omit<CartItem, 'qty'>) {
  const opt = (item as any).options ? JSON.stringify((item as any).options) : ''
  const color = (item as any).color || ''
  return `${(item as any).id}|${color}|${opt}`
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)
  const initedRef = useRef(false)

  useEffect(() => {
    if (initedRef.current) return
    initedRef.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setItems(prev => {
      const key = makeKey(item)
      const idx = prev.findIndex(p => makeKey(p) === key)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty }
        return copy
      }
      return [...prev, { ...item, qty }]
    })
    setOpen(true)
  }, [])

  const remove = useCallback((id: number, key?: string) => {
    setItems(prev => prev.filter(p => (key ? makeKey(p) !== key : p.id !== id)))
  }, [])

  const updateQty = useCallback((id: number, qty: number, key?: string) => {
    setItems(prev => prev.map(p => {
      const match = key ? makeKey(p) === key : p.id === id
      if (!match) return p
      return { ...p, qty: Math.max(1, qty) }
    }))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((a, b) => a + b.qty, 0), [items])
  const total = useMemo(() => items.reduce((a, b) => a + b.price * b.qty, 0), [items])

  const value = useMemo<CartState>(() => ({ items, add, remove, updateQty, clear, count, total, open, setOpen }), [items, add, remove, updateQty, clear, count, total, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}


