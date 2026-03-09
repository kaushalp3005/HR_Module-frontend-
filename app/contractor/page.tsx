"use client"
import Link from "next/link"
import { useMemo, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { getWorkers } from "@/lib/api"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react"

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

export default function ContractorDashboard() {
  const user = useAppStore((state) => state.user)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch workers on mount
  useEffect(() => {
    const fetchWorkers = async () => {
      if (!user?.contractorId) return
      
      try {
        setLoading(true)
        const data = await getWorkers({ contractor_id: user.contractorId })
        setWorkers(data.map((w: any) => ({ ...w, id: String(w.id) })))
      } catch (error) {
        console.error("Failed to fetch workers:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorkers()
  }, [user?.contractorId])

  const pendingWorkers = useMemo(() => workers.filter((w) => w.status === "pending"), [workers])
  const approvedWorkers = useMemo(() => workers.filter((w) => w.status === "approved"), [workers])
  const rejectedWorkers = useMemo(() => workers.filter((w) => w.status === "rejected"), [workers])

  const totalWorkers = workers.length
  const submissionRate = totalWorkers === 0 ? 0 : Math.round((approvedWorkers.length / totalWorkers) * 100)
  const reviewBacklog = totalWorkers === 0 ? 0 : Math.round((pendingWorkers.length / totalWorkers) * 100)

  const submissionPercent = Math.max(0, Math.min(100, submissionRate))
  const backlogPercent = Math.max(0, Math.min(100, reviewBacklog))

  const thirtyDaysAgo = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - 30)
    return date
  }, [])

  const recentJoinees = useMemo(
    () =>
      workers.filter((worker) => {
        if (!worker.date_of_joining) return false
        const joinDate = new Date(worker.date_of_joining)
        if (Number.isNaN(joinDate.getTime())) return false
        return joinDate >= thirtyDaysAgo
      }),
    [thirtyDaysAgo, workers],
  )

  const recentByLocation = useMemo(() => {
    const stats = new Map<string, number>()
    recentJoinees.forEach((worker) => {
      const location = worker.work_location?.toUpperCase() || "UNASSIGNED"
      stats.set(location, (stats.get(location) ?? 0) + 1)
    })

    return Array.from(stats.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
  }, [recentJoinees])

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
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#ff9e3d] via-[#feba66] to-[#fecb83] p-6 sm:p-8 text-black shadow-2xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Contractor Pulse
              </div>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Stay audit-ready every day</h2>
              <p className="mt-3 max-w-xl text-sm text-white sm:text-base">
                Monitor submissions, track compliance checkpoints, and keep your workforce job-ready with real-time
                insights.
              </p>
              <p className="mt-2 max-w-lg text-xs font-medium uppercase tracking-[0.24em] text-white sm:text-sm">
                ADD WORKERS INSTANTLY, SUBMIT DOCUMENTS, AND STAY COMPLIANT WITHOUT DELAYS.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-[#d9822e] shadow-md transition hover:bg-orange-50 hover:text-[#060300]"
              >
                <Link href="/contractor/workers/add">Add Worker </Link>
              </Button>
              <Button className="bg-white/10 text-white shadow-md transition hover:bg-white/20" >
                Upload Documents
              </Button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <HeroStat label="Total Workers" value={totalWorkers} subtitle={`${approvedWorkers.length} APPROVED`} />
            <HeroStat label="APPROVED" value={approvedWorkers.length} subtitle={`${submissionPercent}% OF TOTAL`} />
            <HeroStat label="PENDING" value={pendingWorkers.length} subtitle={`${backlogPercent}% OF TOTAL`} />
            <HeroStat label="REJECTED" value={rejectedWorkers.length} subtitle="ACTION REQUIRED" />
          </div>
        </div>

        <Card className="rounded-3xl border-none bg-white shadow-xl">
          <CardHeader className="px-8 pb-0 pt-8">
            <CardTitle className="text-lg font-semibold text-stone-800">Last 30 Days Joinees</CardTitle>
            <p className="text-sm text-stone-500">See where your newest workers joined in the past month.</p>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6">
            <RecentJoinSummary total={recentJoinees.length} locations={recentByLocation} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <MetricTile
          icon={<Users className="h-5 w-5 text-[#d9822e]" />}
          title="Total Workforce"
          value={approvedWorkers.length}
          subtitle="Active workers"
        />
        <MetricTile
          icon={<Clock className="h-5 w-5 text-[#d9822e]" />}
          title="Awaiting Review"
          value={pendingWorkers.length}
          subtitle="Workers in HR queue"
        />
        <MetricTile
          icon={<AlertCircle className="h-5 w-5 text-[#f3a24a]" />}
          title="Rejected Workers"
          value={rejectedWorkers.length}
          subtitle="Action required"
        />
        <MetricTile
          icon={<CheckCircle className="h-5 w-5 text-[#1ba97a]" />}
          title="Last 30 Days Joinees"
          value={recentJoinees.length}
          subtitle="New additions"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-none bg-white shadow-xl">
          <CardHeader className="px-8 pb-0 pt-8">
            <CardTitle className="text-lg font-semibold text-stone-800">HR Approval Snapshot</CardTitle>
            <p className="text-sm text-stone-500">Track the overall status of your submissions with HR.</p>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6">
            <HrStatusSummary
              total={totalWorkers}
              approved={approvedWorkers.length}
              pending={pendingWorkers.length}
              rejected={rejectedWorkers.length}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-white shadow-xl">
          <CardHeader className="flex flex-col gap-2 px-8 pb-0 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-800">Pending Approvals</CardTitle>
              <p className="text-sm text-stone-500">
                Resolve HR feedback quickly to keep your workers deployment-ready.
              </p>
            </div>
            <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-600">
              {pendingWorkers.length} in queue
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6">
            <PendingWorkerList workers={pendingWorkers} />
          </CardContent>
        </Card>
      </section>


    </div>
  )
}

function MetricTile({
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
    <div className="flex flex-col gap-3 rounded-3xl border border-[#fdd9aa] bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fee0b6] text-[#d9822e]">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f7c88d]">Status</span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-stone-900">{value}</p>
        <p className="text-xs text-stone-500">{subtitle}</p>
      </div>
    </div>
  )
}



function HrStatusSummary({
  total,
  approved,
  pending,
  rejected,
}: {
  total: number
  approved: number
  pending: number
  rejected: number
}) {
  const statusItems = [
    { label: "TOTAL WORKERS", value: total, tone: "text-stone-900" },
    { label: "APPROVED", value: approved, tone: "text-emerald-600" },
    { label: "PENDING HR REVIEW", value: pending, tone: "text-amber-600" },
    { label: "REJECTED", value: rejected, tone: "text-red-600" },
  ]

  return (
    <div className="grid gap-4">
      {statusItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{item.label}</p>
          </div>
          <span className={`text-2xl font-semibold ${item.tone}`}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function RecentJoinSummary({
  total,
  locations,
}: {
  total: number
  locations: { location: string; count: number }[]
}) {
  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">
        No workers joined in the last 30 days. New joinees will appear here automatically.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-orange-50 px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-800/70">Total Joinees (30 Days)</p>
        <p className="mt-2 text-3xl font-semibold text-orange-900">{total}</p>
      </div>

      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.location}
            className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-stone-800">{location.location}</p>
              <p className="text-xs text-stone-500">JOIN LOCATION</p>
            </div>
            <span className="text-xl font-semibold text-stone-900">{location.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PendingWorkerList({ workers }: { workers: Worker[] }) {
  if (workers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-8 text-center text-sm text-stone-500">
        No pending approvals right now. Submit new worker profiles to see them here.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {workers.slice(0, 6).map((worker) => {
        const initials = worker.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()

        return (
          <div
            key={worker.id}
            className="group flex flex-col gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4 transition hover:border-[#fbc27a]/40 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#d9822e] shadow-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">{worker.name.toUpperCase()}</p>
                <p className="text-xs text-stone-500">
                  {worker.designation.toUpperCase()} • {worker.work_location?.toUpperCase() || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 text-left sm:items-end sm:text-right">
              <Badge className="gap-1 bg-[#fbc27a]/30 text-[#d9822e]">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
              {worker.emp_id && (
                <p className="text-xs text-stone-500">
                  Emp ID: {worker.emp_id}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}



function HeroStat({ label, value, subtitle }: { label: string; value: number; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/85">{subtitle}</p>
    </div>
  )
}
