import type { CampaignStatus } from "../types"

export const STATUS_META: Record<CampaignStatus, { label: string; className: string; dot: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  sending: {
    label: "Sending",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    dot: "bg-blue-500",
  },
}

export function statusMeta(status: string): { label: string; className: string; dot: string } {
  return STATUS_META[(status as CampaignStatus) ?? "draft"] ?? STATUS_META.draft
}

export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—"
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
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
  return formatDate(ts)
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function rateColor(rate: number): string {
  if (rate >= 25) return "text-emerald-600 dark:text-emerald-400"
  if (rate >= 10) return "text-amber-600 dark:text-amber-400"
  return "text-slate-500"
}
