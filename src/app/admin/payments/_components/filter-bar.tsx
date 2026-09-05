"use client"

import { CalendarRange, Filter, FilterX, X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { methodLabel, providerLabel } from "../lib/format"
import type { PaymentsState } from "../use-payments-state"

const DAY_PRESETS: { value: number; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last year" },
  { value: 0, label: "All time" },
]

const STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
]

export function FilterBar({
  state,
  providers,
  methods,
}: {
  state: PaymentsState
  providers: string[]
  methods: string[]
}) {
  const activeChips: { key: string; label: string; onClear: () => void }[] = []
  if (state.debouncedSearch)
    activeChips.push({
      key: "search",
      label: `Search: “${state.debouncedSearch}”`,
      onClear: () => state.setSearch(""),
    })
  if (state.provider !== "all")
    activeChips.push({
      key: "provider",
      label: `Provider: ${providerLabel(state.provider)}`,
      onClear: () => state.setProvider("all"),
    })
  if (state.method !== "all")
    activeChips.push({
      key: "method",
      label: `Method: ${methodLabel(state.method)}`,
      onClear: () => state.setMethod("all"),
    })
  if (state.status !== "all")
    activeChips.push({
      key: "status",
      label: `Status: ${state.status.charAt(0).toUpperCase()}${state.status.slice(1)}`,
      onClear: () => state.setStatus("all"),
    })

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-3 [.border-b]:pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-heading text-sm font-semibold">Filters</h3>
          {activeChips.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-semibold">
              {activeChips.length} active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={state.resetFilters}
          disabled={!state.hasFilters}
          className="text-muted-foreground"
        >
          <FilterX className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Search payment ID, customer, email, order…"
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              onClear={() => state.setSearch("")}
            />
          </div>

          <Select value={state.status} onValueChange={(v) => state.setStatus(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.provider} onValueChange={(v) => state.setProvider(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>{providerLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.days > 0 ? String(state.days) : "0"} onValueChange={(v) => state.setDays(Number(v ?? 30))}>
            <SelectTrigger>
              <CalendarRange className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_PRESETS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {methods.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Methods:</span>
            <Button
              variant={state.method === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => state.setMethod("all")}
              className="h-7 px-2 text-xs"
            >
              All
            </Button>
            {methods.map((m) => (
              <Button
                key={m}
                variant={state.method === m ? "secondary" : "ghost"}
                size="sm"
                onClick={() => state.setMethod(m)}
                className="h-7 px-2 text-xs"
              >
                {methodLabel(m)}
              </Button>
            ))}
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Active:</span>
            {activeChips.map((chip) => (
              <Badge key={chip.key} variant="secondary" className="gap-1 py-0.5 pr-1 text-xs font-normal">
                <span className="max-w-[220px] truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
