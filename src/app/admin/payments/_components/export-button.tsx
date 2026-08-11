"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import type { PaymentsState } from "../use-payments-state"

export function ExportButton({ state, disabled }: { state: PaymentsState; disabled?: boolean }) {
  const exportCsv = useAction(api.paymentsExport.exportCsv)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportCsv({
        status: state.status !== "all" ? state.status : undefined,
        provider: state.provider !== "all" ? state.provider : undefined,
        method: state.method !== "all" ? state.method : undefined,
        search: state.debouncedSearch || undefined,
        days: state.days,
      })

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success(
        result.truncated
          ? `Exported ${result.count.toLocaleString()} rows (truncated to the newest ${result.count.toLocaleString()})`
          : `Exported ${result.count.toLocaleString()} rows`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || disabled}>
      {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
      {exporting ? "Exporting…" : "Export CSV"}
    </Button>
  )
}
