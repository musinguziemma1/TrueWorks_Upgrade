import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

const PROVIDER_STYLES: Record<string, string> = {
  stripe: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  pesapal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
}

export function providerStyle(provider?: string): string {
  if (!provider) return "bg-muted text-muted-foreground dark:bg-white/5 dark:text-muted-foreground"
  return PROVIDER_STYLES[provider] ?? "bg-muted text-muted-foreground dark:bg-white/5 dark:text-muted-foreground"
}

export function providerLabel(provider?: string): string {
  if (!provider) return "—"
  return provider === "stripe" ? "Stripe" : provider === "pesapal" ? "Pesapal" : provider
}

const METHOD_ICONS: Record<string, LucideIcon> = {
  card: CreditCard,
  credit_card: CreditCard,
  creditcard: CreditCard,
  mobile: Smartphone,
  mpesa: Smartphone,
  mobile_money: Smartphone,
  bank: Landmark,
  bank_transfer: Landmark,
}

export function methodIcon(method?: string): LucideIcon {
  if (!method) return Wallet
  return METHOD_ICONS[method.toLowerCase()] ?? Wallet
}

export function MethodIcon({ method, className }: { method?: string; className?: string }) {
  switch (method?.toLowerCase()) {
    case "card":
    case "credit_card":
    case "creditcard":
      return <CreditCard className={className} />
    case "mobile":
    case "mpesa":
    case "mobile_money":
      return <Smartphone className={className} />
    case "bank":
    case "bank_transfer":
      return <Landmark className={className} />
    default:
      return <Wallet className={className} />
  }
}

export function methodLabel(method?: string): string {
  if (!method) return "—"
  return method
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export const STATUS_META: Record<PaymentStatus, { label: string; className: string; dot: string }> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    className: "bg-muted text-muted-foreground dark:bg-white/10 dark:text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export function statusMeta(status?: string): { label: string; className: string; dot: string } {
  return STATUS_META[(status as PaymentStatus) ?? "pending"] ?? STATUS_META.pending
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case "UGX":
      return "UGX "
    case "KES":
      return "KES "
    case "USD":
      return "$"
    default:
      return `${currency} `
  }
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = currencySymbol(currency)
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function initials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || "?"
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function successRateColor(rate: number): string {
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (rate >= 70) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export function providerDashboardUrl(provider: string, paymentId: string): string | null {
  if (provider === "stripe") return `https://dashboard.stripe.com/payments/${paymentId}`
  return null
}
