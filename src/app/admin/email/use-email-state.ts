"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export interface EmailFilters {
  search: string
  debouncedSearch: string
  campaignStatus: string
  subscriberActive: string
}

export interface EmailState extends EmailFilters {
  campaignPage: number
  campaignPageSize: number
  campaignTotal: number
  subscriberPage: number
  subscriberPageSize: number
  subscriberTotal: number
  hasCampaignFilters: boolean
  hasSubscriberFilters: boolean
  setSearch: (v: string) => void
  setCampaignStatus: (v: string) => void
  setSubscriberActive: (v: string) => void
  setCampaignPage: (p: number) => void
  setCampaignPageSize: (s: number) => void
  setCampaignTotal: (t: number) => void
  setSubscriberPage: (p: number) => void
  setSubscriberPageSize: (s: number) => void
  setSubscriberTotal: (t: number) => void
  resetCampaignFilters: () => void
  resetSubscriberFilters: () => void
}

export function useEmailState(): EmailState {
  const [search, setSearchRaw] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [campaignStatus, setCampaignStatusRaw] = useState("all")
  const [subscriberActive, setSubscriberActiveRaw] = useState("all")

  const [campaignPage, setCampaignPage] = useState(1)
  const [campaignPageSize, setCampaignPageSize] = useState(10)
  const [campaignTotal, setCampaignTotal] = useState(0)

  const [subscriberPage, setSubscriberPage] = useState(1)
  const [subscriberPageSize, setSubscriberPageSize] = useState(25)
  const [subscriberTotal, setSubscriberTotal] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(id)
  }, [search])

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v)
    setCampaignPage(1)
    setSubscriberPage(1)
  }, [])

  const setCampaignStatus = useCallback((v: string) => {
    setCampaignStatusRaw(v)
    setCampaignPage(1)
  }, [])

  const setSubscriberActive = useCallback((v: string) => {
    setSubscriberActiveRaw(v)
    setSubscriberPage(1)
  }, [])

  const setCampaignPageCb = useCallback((p: number) => setCampaignPage(p), [])
  const setCampaignPageSizeCb = useCallback((s: number) => {
    setCampaignPageSize(s)
    setCampaignPage(1)
  }, [])
  const setCampaignTotalCb = useCallback((t: number) => setCampaignTotal(t), [])
  const setSubscriberPageCb = useCallback((p: number) => setSubscriberPage(p), [])
  const setSubscriberPageSizeCb = useCallback((s: number) => {
    setSubscriberPageSize(s)
    setSubscriberPage(1)
  }, [])
  const setSubscriberTotalCb = useCallback((t: number) => setSubscriberTotal(t), [])

  const resetCampaignFilters = useCallback(() => {
    setSearchRaw("")
    setDebouncedSearch("")
    setCampaignStatusRaw("all")
    setCampaignPage(1)
  }, [])

  const resetSubscriberFilters = useCallback(() => {
    setSearchRaw("")
    setDebouncedSearch("")
    setSubscriberActiveRaw("all")
    setSubscriberPage(1)
  }, [])

  const hasCampaignFilters = useMemo(
    () => debouncedSearch !== "" || campaignStatus !== "all",
    [debouncedSearch, campaignStatus]
  )
  const hasSubscriberFilters = useMemo(
    () => debouncedSearch !== "" || subscriberActive !== "all",
    [debouncedSearch, subscriberActive]
  )

  return {
    search,
    debouncedSearch,
    campaignStatus,
    subscriberActive,
    campaignPage,
    campaignPageSize,
    campaignTotal,
    subscriberPage,
    subscriberPageSize,
    subscriberTotal,
    hasCampaignFilters,
    hasSubscriberFilters,
    setSearch,
    setCampaignStatus,
    setSubscriberActive,
    setCampaignPage: setCampaignPageCb,
    setCampaignPageSize: setCampaignPageSizeCb,
    setCampaignTotal: setCampaignTotalCb,
    setSubscriberPage: setSubscriberPageCb,
    setSubscriberPageSize: setSubscriberPageSizeCb,
    setSubscriberTotal: setSubscriberTotalCb,
    resetCampaignFilters,
    resetSubscriberFilters,
  }
}
