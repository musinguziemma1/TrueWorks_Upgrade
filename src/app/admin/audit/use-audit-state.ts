"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AuditLog } from "./types"

export type AuditTab = "all" | "errors" | "performance"

export interface AuditFilters {
  search: string
  debouncedSearch: string
  entity: string
  action: string
  level: string
  source: string
  actor: string
  days: number
}

export interface AuditState extends AuditFilters {
  tab: AuditTab
  page: number
  pageSize: number
  total: number
  hasFilters: boolean
  detailLog: AuditLog | null
  setSearch: (v: string) => void
  setEntity: (v: string) => void
  setAction: (v: string) => void
  setLevel: (v: string) => void
  setSource: (v: string) => void
  setActor: (v: string) => void
  setDays: (v: number) => void
  setTab: (t: AuditTab) => void
  setPage: (p: number) => void
  setPageSize: (s: number) => void
  setTotal: (t: number) => void
  setDetailLog: (log: AuditLog | null) => void
  resetFilters: () => void
}

export function useAuditState(): AuditState {
  const [search, setSearchRaw] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [entity, setEntity] = useState("all")
  const [action, setAction] = useState("all")
  const [level, setLevel] = useState("all")
  const [source, setSource] = useState("all")
  const [actor, setActor] = useState("all")
  const [days, setDays] = useState(30)
  const [tab, setTab] = useState<AuditTab>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(id)
  }, [search])

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v)
    setPage(1)
  }, [])

  const setEntityCb = useCallback((v: string) => { setEntity(v); setPage(1) }, [])
  const setActionCb = useCallback((v: string) => { setAction(v); setPage(1) }, [])
  const setLevelCb = useCallback((v: string) => { setLevel(v); setPage(1) }, [])
  const setSourceCb = useCallback((v: string) => { setSource(v); setPage(1) }, [])
  const setActorCb = useCallback((v: string) => { setActor(v); setPage(1) }, [])
  const setDaysCb = useCallback((v: number) => { setDays(v); setPage(1) }, [])

  const setPageCb = useCallback((p: number) => setPage(p), [])
  const setPageSizeCb = useCallback((s: number) => { setPageSize(s); setPage(1) }, [])
  const setTotalCb = useCallback((t: number) => setTotal(t), [])
  const setTabCb = useCallback((t: AuditTab) => setTab(t), [])

  const resetFilters = useCallback(() => {
    setSearchRaw("")
    setDebouncedSearch("")
    setEntity("all")
    setAction("all")
    setLevel("all")
    setSource("all")
    setActor("all")
    setDays(30)
    setPage(1)
  }, [])

  const hasFilters = useMemo(
    () => debouncedSearch !== "" || entity !== "all" || action !== "all" || level !== "all" || source !== "all" || actor !== "all" || days > 0,
    [debouncedSearch, entity, action, level, source, actor, days]
  )

  return {
    search,
    debouncedSearch,
    entity,
    action,
    level,
    source,
    actor,
    days,
    tab,
    page,
    pageSize,
    total,
    hasFilters,
    setSearch,
    setEntity: setEntityCb,
    setAction: setActionCb,
    setLevel: setLevelCb,
    setSource: setSourceCb,
    setActor: setActorCb,
    setDays: setDaysCb,
    setTab: setTabCb,
    setPage: setPageCb,
    setPageSize: setPageSizeCb,
    setTotal: setTotalCb,
    detailLog,
    setDetailLog,
    resetFilters,
  }
}
