"use client"

import { CalendarRange, FilterX, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SOURCE_LABELS } from "../lib/format"
import type { AuditState } from "../use-audit-state"

const DAY_PRESETS: { value: number; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last year" },
  { value: 0, label: "All time" },
]

const LEVELS = ["info", "warning", "error", "critical"]

export function FilterBar({
  state,
  entities,
  actions,
  actors,
}: {
  state: AuditState
  entities: string[]
  actions: string[]
  actors: string[]
}) {
  const activeChips: { label: string; onClear: () => void }[] = []
  if (state.debouncedSearch) activeChips.push({ label: `Search: “${state.debouncedSearch}”`, onClear: () => state.setSearch("") })
  if (state.entity !== "all") activeChips.push({ label: state.entity, onClear: () => state.setEntity("all") })
  if (state.action !== "all") activeChips.push({ label: state.action, onClear: () => state.setAction("all") })
  if (state.level !== "all") activeChips.push({ label: `Level: ${state.level}`, onClear: () => state.setLevel("all") })
  if (state.source !== "all") activeChips.push({ label: `Source: ${state.source}`, onClear: () => state.setSource("all") })
  if (state.actor !== "all") activeChips.push({ label: `Actor: ${state.actor}`, onClear: () => state.setActor("all") })

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <SearchInput
              placeholder="Search action, summary, actor, entity…"
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              onClear={() => state.setSearch("")}
            />
          </div>

          <Select value={state.entity} onValueChange={(v) => state.setEntity(v ?? "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.action} onValueChange={(v) => state.setAction(v ?? "all")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.level} onValueChange={(v) => state.setLevel(v ?? "all")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.source} onValueChange={(v) => state.setSource(v ?? "all")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.keys(SOURCE_LABELS).map((s) => (
                <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.actor} onValueChange={(v) => state.setActor(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actors</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
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

          <Button variant="ghost" size="sm" onClick={state.resetFilters} disabled={!state.hasFilters} className="text-muted-foreground">
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
