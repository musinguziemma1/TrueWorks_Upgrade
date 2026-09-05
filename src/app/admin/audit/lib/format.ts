import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Ban,
  FileText,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Send,
  Shield,
  Trash2,
  Upload,
} from "lucide-react"

export type LogLevel = "info" | "warning" | "error" | "critical"
export type LogSource = "mutation" | "query" | "http" | "webhook" | "action" | "scheduler"

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

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function initials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || "?"
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export const LEVEL_STYLES: Record<LogLevel, { className: string; icon: typeof FileText }> = {
  info: { className: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400", icon: Activity },
  warning: { className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: AlertTriangle },
  error: { className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: AlertCircle },
  critical: { className: "bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-400", icon: AlertCircle },
}

export function levelStyle(level?: string): { className: string; icon: typeof FileText } {
  return LEVEL_STYLES[(level as LogLevel) ?? "info"] ?? LEVEL_STYLES.info
}

const ACTION_STYLES: Record<string, { className: string; icon: typeof FileText }> = {
  create: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: Plus },
  update: { className: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400", icon: Pencil },
  delete: { className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: Trash2 },
  remove: { className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: Trash2 },
  revoke: { className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: Ban },
  suspend: { className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: Ban },
  activate: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: Power },
  reset_limit: { className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: RefreshCcw },
  resend: { className: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400", icon: Send },
  upload: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: Upload },
  role_change: { className: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400", icon: Shield },
}

export function actionStyle(action: string): { className: string; icon: typeof FileText } {
  if (action.includes("role_change")) return ACTION_STYLES.role_change
  if (action.endsWith(".create") || action.endsWith(".add")) return ACTION_STYLES.create
  if (action.endsWith(".update") || action.endsWith(".bulk_update")) return ACTION_STYLES.update
  if (action.endsWith(".delete")) return ACTION_STYLES.delete
  if (action.endsWith(".remove")) return ACTION_STYLES.remove
  if (action.endsWith(".revoke")) return ACTION_STYLES.revoke
  if (action.endsWith(".suspend")) return ACTION_STYLES.suspend
  if (action.endsWith(".activate")) return ACTION_STYLES.activate
  if (action.endsWith(".reset_limit")) return ACTION_STYLES.reset_limit
  if (action.endsWith(".resend")) return ACTION_STYLES.resend
  if (action.endsWith(".upload")) return ACTION_STYLES.upload
  if (action.includes("status_update")) {
    return { className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: Activity }
  }
  return { className: "bg-muted text-muted-foreground dark:bg-white/5 dark:text-muted-foreground", icon: FileText }
}

export const SOURCE_LABELS: Record<string, string> = {
  mutation: "Mutation",
  query: "Query",
  http: "HTTP",
  webhook: "Webhook",
  action: "Action",
  scheduler: "Scheduler",
}

const SOURCE_STYLES: Record<string, string> = {
  mutation: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  query: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  http: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  webhook: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  action: "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  scheduler: "bg-muted text-muted-foreground dark:bg-white/5 dark:text-muted-foreground",
}

export function sourceStyle(source?: string): string {
  return source ? (SOURCE_STYLES[source] ?? SOURCE_STYLES.scheduler) : SOURCE_STYLES.scheduler
}

export function latencyColor(ms: number): string {
  if (ms > 5000) return "text-red-600 dark:text-red-400"
  if (ms > 2000) return "text-amber-600 dark:text-amber-400"
  return "text-primary"
}

export function barColor(level: string): string {
  switch (level) {
    case "critical": return "bg-red-600"
    case "error": return "bg-red-500"
    case "warning": return "bg-amber-500"
    default: return "bg-sky-500"
  }
}
