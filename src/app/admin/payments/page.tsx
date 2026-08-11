"use client"

import { useEffect } from "react"
import { Radio } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { useQuery } from "convex/react"
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
            <ExportButton state={state} disabled={loadingStats && loadingData} />
          </div>
        }
      />

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
