"use client"

import { useSettings } from "@/lib/settings-context"

export function FooterCopyright() {
  const settings = useSettings()

  return (
    <p className="text-xs text-white/70">
      &copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.
    </p>
  )
}
