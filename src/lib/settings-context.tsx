"use client"

import { createContext, useContext, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

interface Settings {
  // General
  siteName: string
  siteTagline: string
  siteDescription: string
  siteUrl: string

  // Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  foregroundColor: string
  headingFont: string
  bodyFont: string
  customCss: string

  // Email
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpFrom: string

  // Payment
  currency: string
  taxRate: number
  pesapalEnabled: boolean

  // Downloads
  maxDownloadsPerPurchase: number
  downloadLinkExpiryDays: number
  downloadMethod: string
  requireLoginToDownload: boolean
  downloadNotifications: boolean

  // Security
  require2fa: boolean
  passwordExpiryDays: number
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  apiRateLimiting: boolean
  ipWhitelist: boolean

  // Storage
  storageProvider: string
  storageUsed: number
  storageMax: number
}

const defaultSettings: Settings = {
  siteName: "TrueWorks Limited",
  siteTagline: "Digital Products Marketplace",
  siteDescription: "Your premier destination for high-quality digital products, templates, and tools.",
  siteUrl: "",
  primaryColor: "#0B2545",
  secondaryColor: "#4A6FA5",
  accentColor: "#C9A227",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F2F5F9",
  foregroundColor: "#1E293B",
  headingFont: "georgia",
  bodyFont: "calibri",
  customCss: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUsername: "",
  smtpFrom: "",
  currency: "UGX",
  taxRate: 18,
  pesapalEnabled: true,
  maxDownloadsPerPurchase: 5,
  downloadLinkExpiryDays: 30,
  downloadMethod: "direct",
  requireLoginToDownload: true,
  downloadNotifications: true,
  require2fa: false,
  passwordExpiryDays: 90,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  apiRateLimiting: true,
  ipWhitelist: false,
  storageProvider: "local",
  storageUsed: 0,
  storageMax: 10,
}

const SettingsContext = createContext<Settings>(defaultSettings)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const rawSettings = useQuery(api.settings.getPublic)

  const settings = useMemo<Settings>(() => {
    if (!rawSettings) return defaultSettings
    return {
      ...defaultSettings,
      ...rawSettings,
    }
  }, [rawSettings])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

export type { Settings }
