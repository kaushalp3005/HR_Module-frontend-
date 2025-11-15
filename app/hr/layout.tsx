"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/api"

const navItems = [
  { href: "/hr", label: "Dashboard", showBadge: false },
  { href: "/hr/contractors", label: "Contractors", showBadge: false },
  { href: "/hr/workers", label: "Total Workers", showBadge: false },
  { href: "/hr/approvals", label: "Approvals", showBadge: true },
]

export default function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const logout = useAppStore((state) => state.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const [isHydrated, setIsHydrated] = React.useState(false)

  // Fetch pending approvals count
  const fetchPendingApprovalsCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers?status=pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingApprovalsCount(data.length)
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals count:", error)
    }
  }

  React.useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!isHydrated) return
    if (!user || user.role !== "hr") {
      router.push("/login")
    } else {
      // Fetch pending approvals count when HR user is authenticated
      fetchPendingApprovalsCount()
      
      // Set up interval to refresh count every 30 seconds
      const interval = setInterval(fetchPendingApprovalsCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user, router, isHydrated])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-8 shadow-lg">
            <div className="size-12 animate-spin rounded-full border-2 border-blue-200 border-t-[#2b6df4]" />
            <p className="text-sm font-medium text-slate-500">Loading your session…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "hr") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 flex-col bg-linear-to-b from-[#2b6df4] via-[#4b86f8] to-[#7aa6ff] text-white shadow-xl">
          <div className="px-8 pt-10 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center font-bold text-lg">
                CF
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">CandorFoods</p>
                <h1 className="text-2xl font-semibold leading-tight">Labour Management</h1>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive ? "bg-white text-[#2b6df4]" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                  {item.showBadge && pendingApprovalsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 min-w-5 text-xs px-1.5 bg-red-500 hover:bg-red-600"
                    >
                      {pendingApprovalsCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="px-8 pb-10">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Logged in as</p>
              <p className="mt-1 text-lg font-semibold">{user?.name ?? "HR Manager"}</p>
              <p className="text-xs text-white/70">You can sign out from the profile menu.</p>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden",
            mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className={cn(
              "absolute top-0 left-0 h-full w-72 translate-x-0 bg-linear-to-b from-[#2b6df4] via-[#4b86f8] to-[#7aa6ff] text-white shadow-xl transition-transform",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-10 pb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">CandorFoods</p>
                <h1 className="text-xl font-semibold">Labour Management</h1>
              </div>
              <button className="rounded-full border border-white/20 p-2" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive ? "bg-white text-[#2b6df4]" : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.showBadge && pendingApprovalsCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 min-w-5 text-xs px-1.5 bg-red-500 hover:bg-red-600"
                      >
                        {pendingApprovalsCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-600 shadow-sm md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Labour Management</p>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Candor Foods Private Limited</h2>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
                  <span>{new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div ref={profileMenuRef} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2 outline-none ring-0 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer select-none"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setProfileMenuOpen((prev) => !prev)
                      }
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-[#3a8bfd] to-[#8bbdff] text-white font-semibold">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "HR"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-slate-900">{user?.name ?? "HR Manager"}</p>
                      <p className="text-xs text-slate-500">Human Resources</p>
                    </div>
                  </div>
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-800">{user?.name ?? "HR Manager"}</p>
                        <p className="text-xs text-slate-500">Human Resources</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-slate-600 hover:bg-slate-100"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  )
}
