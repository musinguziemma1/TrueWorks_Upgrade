"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusColorMap: Record<string, string> = {
   // Green
   active: "bg-green-50 text-green-700 border-green-200",
   completed: "bg-green-50 text-green-700 border-green-200",
   paid: "bg-green-50 text-green-700 border-green-200",
   success: "bg-green-50 text-green-700 border-green-200",
   approved: "bg-green-50 text-green-700 border-green-200",
   subscribed: "bg-green-50 text-green-700 border-green-200",
   low: "bg-green-50 text-green-700 border-green-200",
   resolved: "bg-green-50 text-green-700 border-green-200",
  // Amber / Yellow
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-amber-50 text-amber-700 border-amber-200",
  // Red
  cancelled: "bg-red-50 text-red-700 border-red-200",
  canceled: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  revoked: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  high: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  // Slate / Gray
  archived: "bg-muted text-muted-foreground border-border",
  refunded: "bg-muted text-muted-foreground border-border",
  disabled: "bg-muted text-muted-foreground border-border",
  closed: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  unsubscribed: "bg-muted text-muted-foreground border-border",
  // Blue
  published: "bg-blue-50 text-blue-700 border-blue-200",
  live: "bg-blue-50 text-blue-700 border-blue-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  sending: "bg-sky-50 text-sky-700 border-sky-200",
  "in progress": "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  // Purple
  scheduled: "bg-purple-50 text-purple-700 border-purple-200",
}

function getDotColor(classes: string) {
  const textClass = classes.split(" ").find((c) => c.startsWith("text-"))
  return textClass ? textClass.replace("text-", "bg-") : "bg-muted-foreground"
}

interface StatusBadgeProps {
  status: string
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const normalized = status?.toString().trim().toLowerCase() || ""
  const colorClasses =
    statusColorMap[normalized] || "bg-muted text-muted-foreground border-border"
  const dotColor = getDotColor(colorClasses)

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium whitespace-nowrap",
        size === "md" ? "text-xs px-2 py-0.5" : "text-[11px] px-1.5 py-0",
        colorClasses
      )}
    >
      <span
        className={cn(
          "rounded-full",
          size === "md" ? "h-2 w-2" : "h-1.5 w-1.5",
          dotColor
        )}
      />
      {status}
    </Badge>
  )
}
