"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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
  totalItems: number
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])

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

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        totalItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
