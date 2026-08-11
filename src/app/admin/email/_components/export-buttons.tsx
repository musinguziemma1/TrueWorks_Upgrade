"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function CampaignsExportButton({
  search,
  status,
  disabled,
}: {
  search?: string
  status?: string
  disabled?: boolean
}) {
  const exportCsv = useAction(api.campaignExport.exportCsv)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setBusy(true)
    try {
      const result = await exportCsv({
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      })
      downloadCsv(result.csv, `campaigns-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success(`Exported ${result.count.toLocaleString()} campaigns`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={busy || disabled}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
      {busy ? "Exporting…" : "Export campaigns"}
    </Button>
  )
}

export function SubscribersExportButton({
  search,
  activeOnly,
  disabled,
}: {
  search?: string
  activeOnly?: boolean
  disabled?: boolean
}) {
  const exportCsv = useAction(api.subscriberExport.exportCsv)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setBusy(true)
    try {
      const result = await exportCsv({
        search: search || undefined,
        activeOnly: activeOnly || undefined,
      })
      downloadCsv(result.csv, `subscribers-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success(`Exported ${result.count.toLocaleString()} subscribers`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={busy || disabled}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  )
}
