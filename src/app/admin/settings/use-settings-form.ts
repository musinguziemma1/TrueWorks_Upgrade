"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import {
  SETTING_BY_KEY,
  SETTING_DEFAULTS,
  SECRET_MASK,
  validateSettingValue,
  type SettingTab,
} from "@convex/settingsSchema"

export type SettingsValues = Record<string, string | number | boolean>

interface DirtyKey {
  key: string
  previous: string | number | boolean
}

export interface SettingsForm {
  values: SettingsValues
  dirtyKeys: Set<string>
  errors: Record<string, string>
  isDirty: boolean
  dirtyCount: number
  saving: boolean
  loading: boolean
  lastSavedAt: number | null
  setValue: (key: string, value: string | number | boolean) => void
  reset: () => void
  save: () => Promise<boolean>
  isDirtyKey: (key: string) => boolean
  dirtyTabs: Set<SettingTab>
  restoreTab: (tab: SettingTab) => void
}

const isSecret = (key: string) => SETTING_BY_KEY[key]?.secret === true

export function useSettingsForm(): SettingsForm {
  const rawSettings = useQuery(api.settings.getAll)
  const setMultiple = useMutation(api.settings.setMultiple)

  const [values, setValues] = useState<SettingsValues>({})
  const [dirty, setDirty] = useState<Record<string, DirtyKey>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const baselineRef = useRef<SettingsValues>({})

  // Load values from DB into local state (merged over schema defaults).
  const loadedRef = useRef(false)
  useEffect(() => {
    if (!rawSettings || loadedRef.current) return
    loadedRef.current = true
    const merged: SettingsValues = { ...SETTING_DEFAULTS }
    for (const [key, value] of Object.entries(rawSettings)) {
      if (key in SETTING_BY_KEY) {
        merged[key] = value as string | number | boolean
      }
    }
    baselineRef.current = { ...merged }
    setValues(merged)
    setDirty({})
    setErrors({})
  }, [rawSettings])

  const setValue = useCallback((key: string, value: string | number | boolean) => {
    // Validate against the schema on every change (except secrets, validated on save).
    const check = isSecret(key) ? { ok: true as const, value } : validateSettingValue(key, value)
    if (!check.ok) {
      setErrors((e) => ({ ...e, [key]: check.error }))
    } else {
      setErrors((e) => {
        const next = { ...e }
        delete next[key]
        return next
      })
    }
    setValues((prev) => {
      const baseline = baselineRef.current[key]
      const next = { ...prev, [key]: value }
      if (value === baseline) {
        setDirty((d) => {
          const copy = { ...d }
          delete copy[key]
          return copy
        })
      } else {
        setDirty((d) => ({ ...d, [key]: { key, previous: baseline ?? value } }))
      }
      return next
    })
  }, [])

  const restoreTab = useCallback((tab: SettingTab) => {
    setValues((prev) => {
      const next = { ...prev }
      for (const field of Object.values(SETTING_BY_KEY)) {
        if (field.tab !== tab) continue
        const baseline = baselineRef.current[field.key] ?? field.default
        next[field.key] = baseline
        setDirty((d) => {
          const copy = { ...d }
          delete copy[field.key]
          return copy
        })
        setErrors((e) => {
          const copy = { ...e }
          delete copy[field.key]
          return copy
        })
      }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setValues({ ...baselineRef.current })
    setDirty({})
    setErrors({})
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    const keys = Object.keys(dirty)
    if (keys.length === 0) {
      toast.info("No changes to save")
      return true
    }

    // Validate all dirty non-secret keys before persisting.
    for (const key of keys) {
      if (isSecret(key)) continue
      const check = validateSettingValue(key, values[key])
      if (!check.ok) {
        setErrors((e) => ({ ...e, [key]: check.error }))
        toast.error(check.error)
        return false
      }
    }

    setSaving(true)
    try {
      // Build entries: skip secret fields whose value is empty or unchanged mask.
      const entries: { key: string; value: unknown }[] = []
      for (const key of keys) {
        const value = values[key]
        if (isSecret(key)) {
          if (value === "" || value === SECRET_MASK) continue
        }
        entries.push({ key, value })
      }
      if (entries.length === 0) {
        toast.info("No changes to save")
        return true
      }
      await setMultiple({ settings: entries })
      // Update baseline to match what was persisted.
      const baseline = { ...baselineRef.current }
      for (const { key, value } of entries) baseline[key] = value as string | number | boolean
      baselineRef.current = baseline
      setDirty({})
      setErrors({})
      setLastSavedAt(Date.now())
      toast.success("Settings saved successfully")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
      return false
    } finally {
      setSaving(false)
    }
  }, [dirty, values, setMultiple])

  const isDirty = Object.keys(dirty).length > 0

  const dirtyTabs = useMemo<Set<SettingTab>>(() => {
    const tabs = new Set<SettingTab>()
    for (const key of Object.keys(dirty)) {
      const field = SETTING_BY_KEY[key]
      if (field) tabs.add(field.tab)
    }
    return tabs
  }, [dirty])

  return {
    values,
    dirtyKeys: useMemo(() => new Set(Object.keys(dirty)), [dirty]),
    errors,
    isDirty,
    dirtyCount: Object.keys(dirty).length,
    saving,
    loading: rawSettings === undefined,
    lastSavedAt,
    setValue,
    reset,
    save,
    isDirtyKey: useCallback((key: string) => key in dirty, [dirty]),
    dirtyTabs,
    restoreTab,
  }
}
