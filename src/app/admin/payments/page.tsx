"use client"

import { useEffect, useState } from "react"
import { Radio, RefreshCw } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
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
  const [removingOrphans, setRemovingOrphans] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [orphaned, setOrphaned] = useState(0)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await reconcile({})
      setOrphaned(res.orphaned)
      setSyncMessage(
        `Synced with orders — ${res.created} created, ${res.updated} updated, ${res.orphaned} orphaned`
      )
    } catch {
      setSyncMessage("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveOrphans = async () => {
    if (orphaned === 0) return
    const confirmed = window.confirm(
      `Delete ${orphaned} orphaned payment record${orphaned === 1 ? "" : "s"} with no matching order? This cannot be undone.`
    )
    if (!confirmed) return
    setRemovingOrphans(true)
    setSyncMessage(null)
    try {
      const res = await reconcile({ removeOrphans: true })
      setOrphaned(0)
      setSyncMessage(`Removed ${res.removedOrphans} orphaned payment record${res.removedOrphans === 1 ? "" : "s"}`)
    } catch {
      setSyncMessage("Orphan removal failed")
    } finally {
      setRemovingOrphans(false)
    }
  }

  const data =
    useQuery(api.payments.list, {
      status: state.status !== "all" ? state.status : undefined,
      provider: state.provider !== "all" ? state.provider : undefined,
      method: state.method !== "all" ? state.method : undefined,
      search: state.debouncedSearch || undefined,
      days: state.days,
      limit: state.pageSize,
      offset: (state.page - 1) * state.pageSize,
    }) ?? { payments: [], total: 0 }

  useEffect(() => {
    setTotal(data.total)
  }, [data.total, setTotal])

  const loadingStats = stats === undefined
  const loadingData = data.payments.length === 0 && data.total === 0

  // Dropdown options derived from the window stats so they're complete.
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
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Radio className="h-3.5 w-3.5 text-emerald-600" />
              Live data
            </span>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:opacity-60"
              title="Rebuild payment records from the orders table"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync with orders"}
            </button>
            {orphaned > 0 && (
              <button
                type="button"
                onClick={handleRemoveOrphans}
                disabled={removingOrphans}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/20 disabled:opacity-60"
                title="Delete payment records that have no matching order"
              >
                {removingOrphans ? "Removing..." : `Remove ${orphaned} orphaned`}
              </button>
            )}
            <ExportButton state={state} disabled={loadingStats && loadingData} />
          </div>
        }
      />

      {syncMessage && (
        <p className="text-xs text-muted-foreground">{syncMessage}</p>
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
        onPageChange={state.setPage}
        onPageSizeChange={state.setPageSize}
        onOpen={handleOpen}
      />

      <DetailDialog payment={state.detailPayment} onClose={() => state.setDetailPayment(null)} />
    </div>
  )
}
