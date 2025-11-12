"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    
    if (user) {
      router.push(user.role === "hr" ? "/hr" : "/contractor")
    } else {
      router.push("/login")
    }
  }, [user, router, isHydrated])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-8 shadow-lg">
        <div className="size-12 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  )
}
