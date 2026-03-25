"use client"
import { useEffect, useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { getWorkers } from "@/lib/api"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Check, Clock, Users, LogOut } from "lucide-react"
import Link from "next/link"

interface Worker {
  id: string
  emp_id?: string
  name: string
  phone: string
  designation: string
  department?: string
  work_location?: string
  date_of_joining?: string
  status: string
  contractor_id: string
  contractor_name?: string
}

export default function HRDashboard() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true)
        const data = await getWorkers()
        setWorkers(data.map((w: any) => ({ ...w, id: String(w.id) })))
      } catch (error) {
        console.error("Failed to fetch workers:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorkers()
  }, [])

  const approvalQueue = useMemo(() => workers.filter((w) => w.status === "pending"), [workers])
  const pendingApprovals = approvalQueue.length
  const activeWorkers = useMemo(() => workers.filter((w) => w.status === "approved"), [workers])
  const exitedWorkers = useMemo(() => workers.filter((w) => w.status === "exit"), [workers])

  const today = new Date()
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const formattedTime = today.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }



  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#3a8bfd] via-[#5d9ffc] to-[#8ab9fb] p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                HR Dashboard
              </div>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Managing {activeWorkers.length} Workers Efficiently!</h2>
              <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                Here&apos;s a snapshot of the key indicators driving your HR operations today. Track recruitment, payroll,
                and compliance in one place.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              className="bg-white text-[#3a8bfd] shadow-md transition hover:bg-slate-100 hover:text-[#2c68d3]"
            >
              <Link href="/hr/approvals">Review Approvals</Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Active Employees</p>
              <p className="mt-2 text-2xl font-bold">{activeWorkers.length}</p>
              <p className="mt-1 text-xs text-emerald-200">Currently working</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Exited Workers</p>
              <p className="mt-2 text-2xl font-bold">{exitedWorkers.length}</p>
              <p className="mt-1 text-xs text-orange-200">Left the organisation</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Total Workers</p>
              <p className="mt-2 text-2xl font-bold">{workers.length}</p>
              <p className="mt-1 text-xs text-white/70">All time</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Approvals Pending</p>
              <p className="mt-2 text-2xl font-bold">{pendingApprovals}</p>
              <p className="mt-1 text-xs text-white/70">Needs review</p>
            </div>
          </div>
        </div>
        <Card className="rounded-3xl border-none bg-white shadow-xl">
          <CardHeader className="px-6 pb-2">
            <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-700">
              <span>Today&apos;s Snapshot</span>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {formattedTime}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-10 w-10 rounded-xl bg-white p-2 text-[#3a8bfd]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
                  <p className="text-sm font-semibold text-slate-700">{formattedDate}</p>
                </div>
              </div>
            <Badge className="bg-[#3a8bfd] text-white">On Track</Badge>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
                <span>Timing Details</span>
                <span>Today 9:00 AM - 6:00 PM</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-white">
                <div className="h-full w-3/4 rounded-full bg-linear-to-r from-[#3a8bfd] to-[#8fbdfd]" />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Duration 9 hrs</span>
                <span>Break 60 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={<Users className="h-5 w-5 text-[#3a8bfd]" />}
          title="Active Workers"
          value={activeWorkers.length}
          subtitle="Currently working"
        />
        <MetricCard
          icon={<LogOut className="h-5 w-5 text-orange-500" />}
          title="Exited Workers"
          value={exitedWorkers.length}
          subtitle="Left the organisation"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-[#3a8bfd]" />}
          title="Pending Approvals"
          value={pendingApprovals}
          subtitle="Awaiting your action"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-3xl border-none bg-white shadow-xl xl:col-span-2">
          <CardHeader className="flex flex-col gap-2 px-8 pb-0 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Pending Approvals</CardTitle>
              <p className="text-sm text-slate-500">Review worker onboarding requests waiting for your approval.</p>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
              {pendingApprovals} in queue
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6">
            <div className="space-y-4">
              {approvalQueue.slice(0, 5).map((worker) => (
                <div
                  key={worker.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-[#3a8bfd]/40 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#3a8bfd] shadow-sm">
                      {worker.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.designation} • {worker.contractor_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-[#fde68a] text-[#854d0e]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                    <Button asChild variant="secondary" size="sm" className="gap-2 bg-white text-[#3a8bfd] hover:bg-slate-100">
                      <Link href="/hr/approvals">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {approvalQueue.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                  No pending approvals at the moment.
                </p>
              )}
            </div>
          </CardContent>
        </Card>


      </section>




    </div>
  )
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode
  title: string
  value: number
  subtitle: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Today</span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}


