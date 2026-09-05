"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Wallet,
  ExternalLink,
  ListChecks,
} from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { TableSkeleton } from "@/components/admin/table-skeleton"
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
  hasFilters,
  onPageChange,
  onPageSizeChange,
  onOpen,
  onClearFilters,
}: {
  payments: Payment[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  hasFilters: boolean
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onOpen: (p: Payment) => void
  onClearFilters: () => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading && payments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-baseline justify-between text-base">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ListChecks className="h-3.5 w-3.5" />
              </span>
              Transactions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TableSkeleton rows={8} cols={6} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ListChecks className="h-3.5 w-3.5" />
            </span>
            Transactions
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {total.toLocaleString()} payment{total === 1 ? "" : "s"}
            {hasFilters && payments.length > 0 && " · filtered"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Wallet className="h-10 w-10" />}
              title="No payments found"
              description={
                hasFilters
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Payments will appear here once customers start checking out."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-[210px]">Customer</TableHead>
                  <TableHead className="w-[130px]">Order</TableHead>
                  <TableHead className="w-[130px]">Method</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
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

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v ?? 25))}>
                <SelectTrigger className="h-7 w-[88px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="hidden sm:inline">
              Page <span className="font-medium text-foreground">{page}</span> of {totalPages} · {total.toLocaleString()} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
