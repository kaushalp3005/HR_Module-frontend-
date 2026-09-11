"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, RefreshCw, UserCheck, UserX, Users } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { AttendanceExportDialog } from "@/components/attendance-export-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api"
import {
  ALL,
  DEFAULT_FILTERS,
  buildAttendanceRegister,
  buildAttendanceRows,
  filterAttendanceRows,
  filterOptions,
  formatTime,
  localDateString,
  type AttendanceFilters,
  type AttendanceRecord,
  type PunchDirection,
  type RosterWorker,
} from "@/lib/attendance"
import { cn } from "@/lib/utils"

// Portal colours, written out as complete class names so Tailwind picks them up
const THEMES = {
  hr: {
    banner: "from-[#3a8bfd] via-[#5d9ffc] to-[#8ab9fb]",
    bannerText: "text-white",
    bannerMuted: "text-white/70",
    bannerSubtle: "text-white/80",
    bannerPanel: "bg-white/15",
    exportButton: "bg-white/20 text-white hover:bg-white/30",
    refreshButton: "text-[#3a8bfd] hover:bg-slate-100",
    presentStat: "text-emerald-300",
    absentStat: "text-red-300",
    focusRing: "focus:ring-[#3a8bfd]",
    primaryButton: "bg-[#3a8bfd] hover:bg-[#2c68d3]",
    spinner: "text-[#3a8bfd]",
  },
  // White text is unreadable on this light orange, so the banner uses dark
  // text and the buttons a deeper orange
  contractor: {
    banner: "from-[#ff9e3d] via-[#feba66] to-[#fecb83]",
    bannerText: "text-stone-900",
    bannerMuted: "text-stone-700",
    bannerSubtle: "text-stone-800",
    bannerPanel: "bg-white/40",
    exportButton: "bg-white/40 text-stone-900 hover:bg-white/60",
    refreshButton: "text-orange-700 hover:bg-orange-50",
    presentStat: "text-emerald-800",
    absentStat: "text-red-700",
    focusRing: "focus:ring-[#f8a24a]",
    primaryButton: "bg-orange-700 hover:bg-orange-800",
    spinner: "text-[#f8a24a]",
  },
}

export type AttendanceMonitorVariant = keyof typeof THEMES

// Punches reach the server within ~10s of being made, so today's view refreshes itself
const POLL_INTERVAL_MS = 30_000

const DIRECTION_OPTIONS = [ALL, "In", "Out"]
const STATUS_OPTIONS = [ALL, "Present", "Not Present"]
const COLUMNS = [
  "Emp Code",
  "Emp Name",
  "Contractor",
  "Designation",
  "Check In",
  "Check Out",
  "Punch Records",
  "Hours",
  "Status",
]

const FILTER_LABEL = "text-xs font-semibold uppercase tracking-wide text-slate-400"
const FILTER_FIELD =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2"

/**
 * One day's punches from the biometric device, with every active worker who
 * has not punched listed as Not Present. Shared by the HR and contractor
 * portals; `variant` only changes the colours.
 */
export function AttendanceMonitor({ variant }: { variant: AttendanceMonitorVariant }) {
  const theme = THEMES[variant]
  const [dateFilter, setDateFilter] = useState(() => localDateString())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [roster, setRoster] = useState<RosterWorker[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState("")
  const [filters, setFilters] = useState<AttendanceFilters>(DEFAULT_FILTERS)
  const [exportOpen, setExportOpen] = useState(false)

  // Only the newest request may update the page. Otherwise a slower older one
  // (the previous date, or a poll) could land last and overwrite it.
  const latestRequest = useRef(0)
  // The roster is the heavy call - the server decrypts every worker's ID
  // numbers - and it does not change between polls, so polls skip it once loaded.
  const rosterLoaded = useRef(false)

  const fetchData = useCallback(async (date: string, { background = false } = {}) => {
    const request = ++latestRequest.current
    if (!background) setLoading(true)
    try {
      const [attRes, workersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/daily?date_filter=${date}`),
        background && rosterLoaded.current ? null : fetch(`${API_BASE_URL}/workers?status=approved`),
      ])
      if (!attRes.ok || (workersRes && !workersRes.ok)) {
        throw new Error(`attendance ${attRes.status}, workers ${workersRes?.status ?? "not requested"}`)
      }
      const attData: { records: AttendanceRecord[] } = await attRes.json()
      const workersData: RosterWorker[] | null = workersRes ? await workersRes.json() : null
      if (request !== latestRequest.current) return

      setRecords(attData.records)
      if (workersData) {
        setRoster(workersData)
        rosterLoaded.current = true
      }
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (error) {
      if (request !== latestRequest.current) return
      console.error("Failed to load attendance:", error)
      // A failed poll leaves the last good figures up. A failed load clears
      // them rather than show another day's data, or everyone as absent.
      if (!background) {
        setRecords([])
        setRoster([])
        rosterLoaded.current = false
        toast.error("Failed to load attendance", { description: "Please try again." })
      }
    } finally {
      if (request === latestRequest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(dateFilter)
  }, [dateFilter, fetchData])

  // Live view: keep today's figures current without the user pressing Refresh.
  // Polls run in the background so the table does not blank out every time.
  useEffect(() => {
    if (dateFilter !== localDateString()) return
    const id = setInterval(() => {
      // Left open past midnight: move on to the new day rather than keep polling the old one
      if (localDateString() !== dateFilter) setDateFilter(localDateString())
      else fetchData(dateFilter, { background: true })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [dateFilter, fetchData])

  const rows = useMemo(() => buildAttendanceRows(records, roster), [records, roster])
  const contractorOptions = useMemo(() => filterOptions(rows, "contractor_name"), [rows])
  const departmentOptions = useMemo(() => filterOptions(rows, "department"), [rows])
  const filtered = useMemo(() => filterAttendanceRows(rows, filters), [rows, filters])

  const presentCount = filtered.filter((r) => r.status === "Present").length
  const absentCount = filtered.length - presentCount

  const setFilter = (key: keyof AttendanceFilters) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const handleRangeExport = async (fromDate: string, toDate: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/attendance/range?from_date=${fromDate}&to_date=${toDate}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to fetch attendance for that range")
      }
      const data: { records: AttendanceRecord[] } = await res.json()
      const { rows: register, days } = buildAttendanceRegister(data.records, roster, fromDate, toDate)

      if (register.length === 0) {
        toast.error("Nothing to export", { description: "No active workers found." })
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(register)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
      XLSX.writeFile(workbook, `attendance_${fromDate}_to_${toDate}.xlsx`)

      const present = register.filter((r) => r.Status === "Present").length
      toast.success(`Downloaded ${register.length.toLocaleString()} rows`, {
        description: `${days} days · ${present.toLocaleString()} present · ${(register.length - present).toLocaleString()} absent`,
      })
      setExportOpen(false)
    } catch (error) {
      console.error("Attendance export failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export attendance")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl bg-linear-to-r p-6 shadow-2xl",
          theme.banner,
          theme.bannerText
        )}
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                theme.bannerPanel,
                theme.bannerSubtle
              )}
            >
              Attendance Monitor
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Employee Punch Monitor</h2>
            <p className={cn("mt-1 text-sm", theme.bannerSubtle)}>
              Real-time attendance from eSSL X2008 biometric device
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastRefreshed && (
              <span className={cn("text-xs", theme.bannerMuted)}>Last updated: {lastRefreshed}</span>
            )}
            <Button
              variant="secondary"
              className={cn("bg-white shadow-md", theme.refreshButton)}
              onClick={() => fetchData(dateFilter)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="secondary"
              className={theme.exportButton}
              onClick={() => setExportOpen(true)}
              // The register marks absences against the worker list, so wait for it
              disabled={roster.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className={cn("rounded-2xl p-4 backdrop-blur", theme.bannerPanel)}>
            <div className="flex items-center gap-2">
              <Users className={cn("h-5 w-5", theme.bannerMuted)} />
              <p className={cn("text-xs uppercase tracking-wide", theme.bannerMuted)}>Total</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className={cn("rounded-2xl p-4 backdrop-blur", theme.bannerPanel)}>
            <div className="flex items-center gap-2">
              <UserCheck className={cn("h-5 w-5", theme.presentStat)} />
              <p className={cn("text-xs uppercase tracking-wide", theme.bannerMuted)}>Present</p>
            </div>
            <p className={cn("mt-1 text-2xl font-bold", theme.presentStat)}>{presentCount}</p>
          </div>
          <div className={cn("rounded-2xl p-4 backdrop-blur", theme.bannerPanel)}>
            <div className="flex items-center gap-2">
              <UserX className={cn("h-5 w-5", theme.absentStat)} />
              <p className={cn("text-xs uppercase tracking-wide", theme.bannerMuted)}>Not Present</p>
            </div>
            <p className={cn("mt-1 text-2xl font-bold", theme.absentStat)}>{absentCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-none bg-white shadow-xl">
        <CardContent className="flex flex-wrap items-end gap-4 px-6 py-5">
          <label className="flex flex-col gap-1">
            <span className={FILTER_LABEL}>Date</span>
            <input
              type="date"
              value={dateFilter}
              // Clearing the field would leave no day to show, so it is ignored
              onChange={(e) => e.target.value && setDateFilter(e.target.value)}
              className={cn(FILTER_FIELD, theme.focusRing)}
            />
          </label>
          <FilterSelect
            label="Contractor"
            value={filters.contractor}
            options={contractorOptions}
            onChange={setFilter("contractor")}
            className={theme.focusRing}
          />
          <FilterSelect
            label="Department"
            value={filters.department}
            options={departmentOptions}
            onChange={setFilter("department")}
            className={theme.focusRing}
          />
          <FilterSelect
            label="Last Punch Direction"
            value={filters.direction}
            options={DIRECTION_OPTIONS}
            onChange={setFilter("direction")}
            className={theme.focusRing}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={setFilter("status")}
            className={theme.focusRing}
          />

          <Button
            className={cn("text-white", theme.primaryButton)}
            onClick={() => fetchData(dateFilter)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Show Records"}
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl border-none bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-6">
          <CardTitle className="text-base font-semibold text-slate-700">
            Punch Records — {new Date(dateFilter + "T00:00:00").toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </CardTitle>
          <span className="text-xs text-slate-400">Total Records: {filtered.length}</span>
        </CardHeader>
        <CardContent className="px-0 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {COLUMNS.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-12 text-center text-slate-400">
                      <RefreshCw className={cn("mx-auto mb-2 h-6 w-6 animate-spin", theme.spinner)} />
                      Loading attendance data…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-12 text-center text-slate-400">
                      No records found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr
                      key={`${row.emp_id}-${i}`}
                      className="border-b border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-700">{row.emp_id}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">{row.worker_name}</td>
                      <td className="px-6 py-3 text-slate-500">{row.contractor_name}</td>
                      <td className="px-6 py-3 text-slate-500">{row.designation}</td>
                      <td className="px-6 py-3 font-medium text-emerald-600">{formatTime(row.check_in)}</td>
                      <td className="px-6 py-3 font-medium text-orange-500">{formatTime(row.check_out)}</td>
                      <td className="px-6 py-3">
                        <PunchDots count={row.total_punches} lastDirection={row.last_direction} />
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row.hours_worked != null ? `${row.hours_worked}h` : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {row.status === "Present" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Present</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Not Present</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AttendanceExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        workerCount={roster.length}
        onExport={handleRangeExport}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
}) {
  // Keep the applied choice listed even if the latest data no longer contains
  // it, so the dropdown always shows the filter that is actually in effect.
  const choices = options.includes(value) ? options : [...options, value]
  return (
    <label className="flex flex-col gap-1">
      <span className={FILTER_LABEL}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(FILTER_FIELD, className)}>
        {choices.map((choice) => (
          <option key={choice}>{choice}</option>
        ))}
      </select>
    </label>
  )
}

function PunchDots({ count, lastDirection }: { count: number; lastDirection: PunchDirection | null }) {
  if (count === 0) return <span className="text-slate-300">—</span>
  return (
    <div className="flex items-center gap-1" title={`${count} punches · last ${lastDirection}`}>
      {/* Punches alternate in (green) and out (orange), starting with an entry */}
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i % 2 === 0 ? "bg-emerald-500" : "bg-orange-400"}`}
        />
      ))}
      {count > 8 && <span className="text-xs text-slate-400">+{count - 8}</span>}
    </div>
  )
}
