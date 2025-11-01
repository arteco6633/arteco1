'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type WishlistItem = {
  id: number
  name: string
  price: number
  image_url?: string | null
  original_price?: number | null
}

type WishlistState = {
  items: WishlistItem[]
  add: (item: WishlistItem) => void
  remove: (id: number) => void
  toggle: (item: WishlistItem) => void
  isInWishlist: (id: number) => boolean
  count: number
}

const WishlistContext = createContext<WishlistState | null>(null)

const STORAGE_KEY = 'arteco_wishlist_v1'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
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

  const add = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.find(p => p.id === item.id)
      if (exists) return prev
      return [...prev, item]
    })
  }, [])

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggle = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.find(p => p.id === item.id)
      if (exists) {
        return prev.filter(p => p.id !== item.id)
      }
      return [...prev, item]
    })
  }, [])

  const isInWishlist = useCallback((id: number) => {
    return items.some(item => item.id === id)
  }, [items])

  const count = useMemo(() => items.length, [items])

  const value = useMemo<WishlistState>(
    () => ({ items, add, remove, toggle, isInWishlist, count }),
    [items, add, remove, toggle, isInWishlist, count]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}

