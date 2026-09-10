"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { usePaymentsState } from "./use-payments-state"
import { StatCards } from "./_components/stat-cards"
import { RevenueChart } from "./_components/revenue-chart"
import { Breakdowns } from "./_components/breakdowns"
import { FilterBar } from "./_components/filter-bar"
import { TransactionsTable } from "./_components/transactions-table"
import { DetailDialog } from "./_components/detail-dialog"
import { ExportButton } from "./_components/export-button"
import type { Payment } from "./types"

export default function PaymentsPage() {
  const state = usePaymentsState()
  const { setTotal } = state

  const stats = useQuery(api.payments.stats, { days: state.days })

  const reconcile = useMutation(api.payments.reconcileFromOrders)
  const [syncing, setSyncing] = useState(false)
  const [confirmOrphanRemoval, setConfirmOrphanRemoval] = useState(false)
  const [removingOrphans, setRemovingOrphans] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null)
  const [orphaned, setOrphaned] = useState(0)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await reconcile({})
      setOrphaned(res.orphaned)
      setSyncMessage({
        tone: "success",
        text: `Synced with orders — ${res.created} created, ${res.updated} updated, ${res.orphaned} orphaned`,
      })
    } catch {
      setSyncMessage({ tone: "error", text: "Sync failed" })
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveOrphans = async () => {
    if (orphaned === 0) return
    setRemovingOrphans(true)
    setSyncMessage(null)
    try {
      const res = await reconcile({ removeOrphans: true })
      setOrphaned(0)
      setSyncMessage({
        tone: "success",
        text: `Removed ${res.removedOrphans} orphaned payment record${res.removedOrphans === 1 ? "" : "s"}`,
      })
    } catch {
      setSyncMessage({ tone: "error", text: "Orphan removal failed" })
    } finally {
      setRemovingOrphans(false)
      setConfirmOrphanRemoval(false)
    }
  }

  const paymentsResult = useQuery(api.payments.list, {
      status: state.status !== "all" ? state.status : undefined,
      provider: state.provider !== "all" ? state.provider : undefined,
      method: state.method !== "all" ? state.method : undefined,
      search: state.debouncedSearch || undefined,
      days: state.days,
      limit: state.pageSize,
      offset: (state.page - 1) * state.pageSize,
    })
  const data = paymentsResult ?? { payments: [], total: 0 }

  useEffect(() => {
    setTotal(data.total)
  }, [data.total, setTotal])

  const loadingStats = stats === undefined
  const loadingData = paymentsResult === undefined

  const providers = Object.keys(stats?.byProvider ?? {}).sort()
  const methods = Object.keys(stats?.byMethod ?? {}).sort()

  const handleOpen = (p: Payment) => state.setDetailPayment(p)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Payments</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Payment Analytics
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Monitor revenue, reconcile transactions, and track payment health
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 sm:inline-flex">
              <Radio className="h-3 w-3 text-emerald-400" />
              Live data
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={handleSync}
              disabled={syncing}
              title="Rebuild payment records from the orders table"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync with orders"}
            </Button>
            {orphaned > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOrphanRemoval(true)}
                disabled={removingOrphans}
                className="border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                title="Delete payment records that have no matching order"
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                {removingOrphans ? "Removing..." : `Remove ${orphaned} orphaned`}
              </Button>
            )}
            <ExportButton state={state} disabled={loadingStats && loadingData} />
          </div>
        </div>
      </section>

      {syncMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            syncMessage.tone === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {syncMessage.tone === "error" ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      <StatCards stats={stats} loading={loadingStats} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart stats={stats} loading={loadingStats} />
        </div>
        <div className="xl:col-span-1">
          <Breakdowns stats={stats} loading={loadingStats} />
        </div>
      </div>

      <FilterBar state={state} providers={providers} methods={methods} />

      <TransactionsTable
        payments={data.payments}
        total={data.total}
        page={state.page}
        pageSize={state.pageSize}
        loading={loadingData}
        hasFilters={state.hasFilters}
        onPageChange={state.setPage}
        onPageSizeChange={state.setPageSize}
        onOpen={handleOpen}
        onClearFilters={state.resetFilters}
      />

      <DetailDialog payment={state.detailPayment} onClose={() => state.setDetailPayment(null)} />

      <ConfirmDialog
        open={confirmOrphanRemoval}
        onOpenChange={(open) => { if (!open && !removingOrphans) setConfirmOrphanRemoval(false) }}
        title={`Delete ${orphaned} orphaned payment record${orphaned === 1 ? "" : "s"}?`}
        description="These payment records have no matching order. Deleting them cannot be undone and may affect financial reconciliation reports."
        confirmLabel={`Delete ${orphaned} record${orphaned === 1 ? "" : "s"}`}
        destructive
        onConfirm={handleRemoveOrphans}
      />
    </div>
  )
}
