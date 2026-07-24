import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencySymbols: Record<string, string> = {
  UGX: "UGX",
  USD: "$",
  KES: "KES",
}

export function formatPrice(price: number, currency: string = "UGX"): string {
  const symbol = currencySymbols[currency] || currency
  return `${symbol} ${price.toLocaleString("en-UG")}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
