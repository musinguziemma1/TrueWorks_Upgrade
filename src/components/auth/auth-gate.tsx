"use client"

import { useAuth } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B2545]" />
      </div>
    )
  }

  return <>{children}</>
}
