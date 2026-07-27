"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"

interface WishlistItem {
  id: string
  name: string
  slug: string
  price: number
  image: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  toggleItem: (item: WishlistItem) => boolean
  isInWishlist: (id: string) => boolean
  replaceItems: (items: WishlistItem[]) => void
  totalItems: number
}

const WishlistContext = createContext<WishlistContextType | null>(null)

const STORAGE_KEY = "trueworks-wishlist"

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const toggleItem = useCallback((item: WishlistItem) => {
    let added = false
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id)
      }
      added = true
      return [...prev, item]
    })
    return added
  }, [])

  const isInWishlist = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  )

  const replaceItems = useCallback((newItems: WishlistItem[]) => {
    setItems(newItems)
  }, [])

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      replaceItems,
      totalItems: items.length,
    }),
    [items, addItem, removeItem, toggleItem, isInWishlist, replaceItems]
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
