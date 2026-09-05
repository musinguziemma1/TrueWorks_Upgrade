"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Radio, RefreshCw } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
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
      <AdminPageHeader
        title="Payments"
        description="Monitor revenue, reconcile transactions, and track payment health across providers."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Payments" }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <Radio className="h-3 w-3 text-emerald-600" />
              Live data
            </span>
            <Button
              variant="outline"
              size="sm"
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
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Delete payment records that have no matching order"
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                {removingOrphans ? "Removing..." : `Remove ${orphaned} orphaned`}
              </Button>
            )}
            <ExportButton state={state} disabled={loadingStats && loadingData} />
          </div>
        }
      />

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
