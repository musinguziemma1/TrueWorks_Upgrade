import type { Id } from "@convex/_generated/dataModel"

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent"

export interface Campaign {
  _id: Id<"campaigns">
  name: string
  subject: string
  content: string
  status: CampaignStatus
  scheduledAt?: number
  sentAt?: number
  sentCount: number
  openCount: number
  clickCount: number
  createdAt: number
  updatedAt: number
}

export interface CampaignPerformance {
  _id: Id<"campaigns">
  name: string
  sentCount: number
  openCount: number
  clickCount: number
  openRate: number
  clickRate: number
  sentAt: number | null
}

export interface CampaignsStats {
  total: number
  sent: number
  draft: number
  scheduled: number
  sending: number
  byStatus: Record<CampaignStatus, number>
  totalSent: number
  totalOpened: number
  totalClicked: number
  avgOpenRate: number
  avgClickRate: number
  subscribers: number
  activeSubscribers: number
  performance: CampaignPerformance[]
}

export interface CampaignsListResult {
  campaigns: Campaign[]
  total: number
}

export interface Subscriber {
  _id: Id<"subscribers">
  email: string
  name?: string
  source?: string
  active: boolean
  createdAt: number
}

export interface SubscribersListResult {
  subscribers: Subscriber[]
  total: number
}
