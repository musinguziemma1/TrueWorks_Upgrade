"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Payment } from "./types"

export interface PaymentsFilters {
  search: string
  debouncedSearch: string
  provider: string
  method: string
  status: string
  days: number
}

export interface PaymentsState extends PaymentsFilters {
  page: number
  pageSize: number
  total: number
  hasFilters: boolean
  detailPayment: Payment | null
  setSearch: (v: string) => void
  setProvider: (v: string) => void
  setMethod: (v: string) => void
  setStatus: (v: string) => void
  setDays: (v: number) => void
  setPage: (p: number) => void
  setPageSize: (s: number) => void
  setTotal: (t: number) => void
  setDetailPayment: (p: Payment | null) => void
  resetFilters: () => void
}

export function usePaymentsState(): PaymentsState {
  const [search, setSearchRaw] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [provider, setProvider] = useState("all")
  const [method, setMethod] = useState("all")
  const [status, setStatus] = useState("all")
  const [days, setDays] = useState(30)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(id)
  }, [search])

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v)
    setPage(1)
  }, [])

  const setProviderCb = useCallback((v: string) => { setProvider(v); setPage(1) }, [])
  const setMethodCb = useCallback((v: string) => { setMethod(v); setPage(1) }, [])
  const setStatusCb = useCallback((v: string) => { setStatus(v); setPage(1) }, [])
  const setDaysCb = useCallback((v: number) => { setDays(v); setPage(1) }, [])

  const setPageCb = useCallback((p: number) => setPage(p), [])
  const setPageSizeCb = useCallback((s: number) => { setPageSize(s); setPage(1) }, [])
  const setTotalCb = useCallback((t: number) => setTotal(t), [])

  const resetFilters = useCallback(() => {
    setSearchRaw("")
    setDebouncedSearch("")
    setProvider("all")
    setMethod("all")
    setStatus("all")
    setDays(30)
    setPage(1)
  }, [])

  const hasFilters = useMemo(
    () =>
      debouncedSearch !== "" ||
      provider !== "all" ||
      method !== "all" ||
      status !== "all" ||
      days > 0,
    [debouncedSearch, provider, method, status, days]
  )

  return {
    search,
    debouncedSearch,
    provider,
    method,
    status,
    days,
    page,
    pageSize,
    total,
    hasFilters,
    detailPayment,
    setSearch,
    setProvider: setProviderCb,
    setMethod: setMethodCb,
    setStatus: setStatusCb,
    setDays: setDaysCb,
    setPage: setPageCb,
    setPageSize: setPageSizeCb,
    setTotal: setTotalCb,
    setDetailPayment,
    resetFilters,
  }
}
