"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check, Copy, Wallet, ExternalLink } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  formatMoney,
  formatTimeAgo,
  initials,
  MethodIcon,
  methodLabel,
  providerLabel,
  providerStyle,
  providerDashboardUrl,
} from "../lib/format"
import type { Payment } from "../types"

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
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

export function TransactionsTable({
  payments,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: {
  payments: Payment[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onOpen: (p: Payment) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading && payments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between text-base">
          <span>Transactions</span>
          <span className="text-xs font-normal text-muted-foreground">
            {total.toLocaleString()} payment{total === 1 ? "" : "s"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="No payments found"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-[200px]">Customer</TableHead>
                  <TableHead className="w-[130px]">Order</TableHead>
                  <TableHead className="w-[120px]">Method</TableHead>
                  <TableHead className="w-[110px] text-right">Amount</TableHead>
                  <TableHead className="w-[110px] text-center">Status</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const dashboardUrl = providerDashboardUrl(p.provider, p.paymentId)
                  return (
                    <TableRow key={p._id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(p)}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimeAgo(p.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-medium">{p.paymentId.slice(0, 14)}</span>
                          <span className={`inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${providerStyle(p.provider)}`}>
                            {providerLabel(p.provider)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                              {initials(p.customerName, p.customerEmail)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{p.customerName || p.customerEmail}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{p.customerEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CopyButton text={p.orderId} label="Order" />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <MethodIcon method={p.method} className="h-3.5 w-3.5 text-muted-foreground" />
                          {methodLabel(p.method)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-semibold">{formatMoney(p.amount, p.currency)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {dashboardUrl && (
                            <a
                              href={dashboardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded p-1 text-muted-foreground hover:text-foreground"
                              title="Open in provider dashboard"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v ?? 25))}>
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
