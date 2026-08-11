import type { Doc, Id } from "@convex/_generated/dataModel"

export type Payment = Doc<"payments">
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface TrendPoint {
  timestamp: number
  revenue: number
  count: number
}

export interface StatsResult {
  total: number
  completed: number
  pending: number
  failed: number
  refunded: number
  totalAmount: number
  successRate: number
  refundRate: number
  avgOrderValue: number
  primaryCurrency: string
  revenueByCurrency: Record<string, number>
  byProvider: Record<string, number>
  byMethod: Record<string, number>
  byStatus: Record<string, number>
  trend: TrendPoint[]
  recentActivity: Payment[]
}

export interface PaymentWithOrder extends Payment {
  order?: {
    orderNumber?: string
    total?: number
    currency?: string
    orderStatus?: string
    itemCount?: number
  } | null
}

export type PaymentId = Id<"payments">
