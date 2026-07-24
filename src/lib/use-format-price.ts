"use client"

import { useSettings } from "@/lib/settings-context"
import { formatPrice } from "@/lib/utils"

export function useFormatPrice() {
  const { currency } = useSettings()
  return (price: number) => formatPrice(price, currency)
}
