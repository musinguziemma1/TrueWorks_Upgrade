"use client"

import { useState } from "react"
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Fingerprint,
  Network,
  Package,
  Timer,
  Wallet,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  formatDateTime,
  formatMoney,
  initials,
  MethodIcon,
  methodLabel,
  providerDashboardLabel,
  providerDashboardUrl,
  providerLabel,
  providerStyle,
  statusMeta,
} from "../lib/format"
import type { Payment } from "../types"

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function DetailDialog({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const order = useQuery(api.orders.getById, payment ? { id: payment.orderId } : "skip")

  if (!payment) return null

  const meta = payment.metadata as Record<string, unknown> | null | undefined
  const refundedAt = typeof meta?.refundedAt === "number" ? meta.refundedAt : undefined
  const refundMethod = typeof meta?.refundMethod === "string" ? meta.refundMethod : undefined
  const dashboardUrl = providerDashboardUrl(payment.provider, payment.paymentId)
  const status = statusMeta(payment.status)

  return (
    <Dialog open={!!payment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${providerStyle(payment.provider)}`}>
                <Wallet className="h-3.5 w-3.5" />
                {providerLabel(payment.provider)}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <DialogTitle className="sr-only">Payment detail</DialogTitle>
            </div>
            <span className="font-mono text-2xl font-bold tabular-nums">{formatMoney(payment.amount, payment.currency)}</span>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials(payment.customerName, payment.customerEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{payment.customerName || payment.customerEmail}</p>
                <p className="truncate text-xs text-muted-foreground">{payment.customerEmail}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Linked Order">
                {order === undefined ? (
                  <Skeleton className="h-5 w-40" />
                ) : order ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      <Package className="h-3 w-3" />
                      {order.orderNumber ?? order._id.slice(0, 8)}
                    </span>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Order unavailable</span>
                )}
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Payment ID">
                <div className="flex flex-col gap-1">
                  <span className="break-all font-mono text-xs">{payment.paymentId}</span>
                  <CopyButton text={payment.paymentId} label="Copy" />
                </div>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Order ID">
                <div className="flex flex-col gap-1">
                  <span className="break-all font-mono text-xs">{payment.orderId}</span>
                  <CopyButton text={payment.orderId} label="Copy" />
                </div>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Method">
                <p className="flex items-center gap-1.5 text-sm">
                  <MethodIcon method={payment.method} className="h-3.5 w-3.5 text-muted-foreground" />
                  {methodLabel(payment.method)}
                </p>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Currency">
                <p className="text-sm font-mono">{payment.currency}</p>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Created">
                <p className="flex items-center gap-1.5 text-sm">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDateTime(payment.createdAt)}
                </p>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Last updated">
                <p className="text-xs text-muted-foreground">{formatDateTime(payment.updatedAt)}</p>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Provider">
                <p className="flex items-center gap-1.5 text-sm">
                  <Network className="h-3.5 w-3.5 text-muted-foreground" />
                  {providerLabel(payment.provider)}
                </p>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Provider dashboard">
                {dashboardUrl ? (
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {providerDashboardLabel(payment.provider)}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Not available</span>
                )}
              </Field>
            </div>
          </div>

          {refundedAt && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <Fingerprint className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                Refunded on <span className="font-medium">{formatDateTime(refundedAt)}</span>
                {refundMethod && (
                  <>
                    {" "}via <span className="font-medium">{refundMethod}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {meta && Object.keys(meta).length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                Provider Metadata
              </p>
              <pre className="max-h-52 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </div>
          )}

          {order?.items && order.items.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Order Items ({order.items.length})
              </p>
              <div className="space-y-1.5">
                {order.items.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{item.productName}</span>
                    <span className="shrink-0 text-muted-foreground">
                      ×{item.quantity} · {formatMoney(item.price, payment.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Amount charged: <span className="font-mono font-medium">{formatMoney(payment.amount, payment.currency)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
