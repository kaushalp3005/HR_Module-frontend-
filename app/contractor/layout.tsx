"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/contractor", label: "Dashboard" },
  { href: "/contractor/workers", label: "Workers" },
  { href: "/contractor/workers-status", label: "Workers Status" },
  // { href: "/contractor/compliance", label: "Compliance" },
]

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const logout = useAppStore((state) => state.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!isHydrated) return
    if (!user || user.role !== "contractor") {
      router.push("/login")
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
      <div className="min-h-screen bg-stone-100 text-slate-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-8 shadow-lg">
            <div className="size-12 animate-spin rounded-full border-2 border-orange-200 border-t-[#f8a24a]" />
            <p className="text-sm font-medium text-stone-500">Loading your session…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "contractor") {
    return null
  }

  return (
    <div className="min-h-screen bg-stone-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 flex-col bg-linear-to-b from-[rgb(252,161,70)] via-[#ffbe6e] to-[#fee0b6] text-white shadow-xl">
          <div className="px-8 pt-10 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">
                CT
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">Plusadmin</p>
                <h1 className="text-2xl font-semibold leading-tight">Contractor Hub</h1>
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive ? "bg-white text-[#d9822e]" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="px-8 pb-10">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Logged in as</p>
              <p className="mt-1 text-lg font-semibold">{user?.contractorName ?? "Contractor"}</p>
              <p className="text-xs text-white/70">Use the profile menu to sign out.</p>
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
              "absolute top-0 left-0 h-full w-72 bg-linear-to-b from-[#f8a24a] via-[#fbc27a] to-[#ffcb82] text-white shadow-xl transition-transform",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-10 pb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Plusadmin</p>
                <h1 className="text-xl font-semibold">Contractor Hub</h1>
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
                      "rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive ? "bg-white text-[#d9822e]" : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 p-2 text-stone-600 shadow-sm md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Contractor Portal</p>
                  <h2 className="text-xl font-semibold text-stone-900 sm:text-2xl">
                    Candor Foods Private Limited
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-xs text-stone-500">
                  <span>
                    {new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div ref={profileMenuRef} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 rounded-full bg-stone-100 px-3 py-2 outline-none transition hover:bg-stone-200 focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer select-none"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setProfileMenuOpen((prev) => !prev)
                      }
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-[#f8a24a] to-[#ffce89] text-white font-semibold">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "CT"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-stone-900">{user?.name ?? "Contractor"}</p>
                      <p className="text-xs text-stone-500">{user?.contractorName ?? "Contractor Partner"}</p>
                    </div>
                  </div>
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-52 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-stone-800">{user?.name ?? "Contractor"}</p>
                        <p className="text-xs text-stone-500">{user?.contractorName ?? "Contractor Partner"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-stone-600 hover:bg-orange-50"
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
