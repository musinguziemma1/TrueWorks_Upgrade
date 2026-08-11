"use client"

import { CalendarRange, FilterX, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { providerLabel, methodLabel } from "../lib/format"
import type { PaymentsState } from "../use-payments-state"

const DAY_PRESETS: { value: number; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last year" },
  { value: 0, label: "All time" },
]

const STATUSES = ["completed", "pending", "failed", "refunded"]

export function FilterBar({
  state,
  providers,
  methods,
}: {
  state: PaymentsState
  providers: string[]
  methods: string[]
}) {
  const activeChips: { label: string; onClear: () => void }[] = []
  if (state.debouncedSearch)
    activeChips.push({ label: `Search: “${state.debouncedSearch}”`, onClear: () => state.setSearch("") })
  if (state.provider !== "all")
    activeChips.push({ label: `Provider: ${providerLabel(state.provider)}`, onClear: () => state.setProvider("all") })
  if (state.method !== "all")
    activeChips.push({ label: `Method: ${methodLabel(state.method)}`, onClear: () => state.setMethod("all") })
  if (state.status !== "all")
    activeChips.push({ label: `Status: ${state.status}`, onClear: () => state.setStatus("all") })

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <SearchInput
              placeholder="Search payment ID, customer, email, order…"
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              onClear={() => state.setSearch("")}
            />
          </div>

          <Select value={state.status} onValueChange={(v) => state.setStatus(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.provider} onValueChange={(v) => state.setProvider(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>{providerLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.method} onValueChange={(v) => state.setMethod(v ?? "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {methods.map((m) => (
                <SelectItem key={m} value={m}>{methodLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(state.days)} onValueChange={(v) => state.setDays(Number(v ?? 30))}>
            <SelectTrigger className="w-[130px]">
              <CalendarRange className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_PRESETS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={state.resetFilters}
            disabled={!state.hasFilters}
            className="text-muted-foreground"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <Badge key={chip.label} variant="secondary" className="gap-1 py-0.5">
                <Play className="h-2.5 w-2.5" />
                <span className="max-w-[220px] truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
