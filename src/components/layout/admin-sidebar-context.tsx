"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface AdminSidebarContextType {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobile: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined)

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = () => setMobileOpen((prev) => !prev)

  return (
    <AdminSidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext)
  if (!context) {
    throw new Error("useAdminSidebar must be used within AdminSidebarProvider")
  }
  return context
}
