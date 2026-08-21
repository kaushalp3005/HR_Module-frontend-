"use client"

import { useEffect, useState, useMemo } from "react"
import { API_BASE_URL } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, RefreshCw, Download } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { AttendanceExportDialog } from "@/components/attendance-export-dialog"

interface AttendanceRecord {
  emp_id: string
  worker_name: string
  contractor_name: string | null
  designation: string | null
  date: string
  check_in: string | null
  check_out: string | null
  total_punches: number
  hours_worked: number | null
}

interface DailyResponse {
  date: string
  total_present: number
  records: AttendanceRecord[]
}

interface Worker {
  emp_id: string
  name: string
  contractor_name: string
  department: string | null
  designation: string
  status: string
}

function formatTime(t: string | null) {
  if (!t) return "—"
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function today() {
  return new Date().toISOString().split("T")[0]
}

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState(today())
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [allWorkers, setAllWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>("")

  // Filter state
  const [filterContractor, setFilterContractor] = useState("All")
  const [filterDepartment, setFilterDepartment] = useState("All")
  const [filterDirection, setFilterDirection] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [exportOpen, setExportOpen] = useState(false)

  const fetchData = async (date: string) => {
    setLoading(true)
    try {
      const [attRes, workersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/daily?date_filter=${date}`),
        fetch(`${API_BASE_URL}/workers?status=approved`),
      ])
      const attData: DailyResponse = attRes.ok ? await attRes.json() : { records: [], date, total_present: 0 }
      const workersData: Worker[] = workersRes.ok ? await workersRes.json() : []

      setAttendance(attData.records)
      setAllWorkers(workersData)
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch {
      setAttendance([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(dateFilter)
  }, [dateFilter])

  // Live view: punches arrive from the device within ~10s, so keep today's
  // figures current without the user having to press Refresh.
  useEffect(() => {
    if (dateFilter !== today()) return
    const id = setInterval(() => fetchData(dateFilter), 30_000)
    return () => clearInterval(id)
  }, [dateFilter])

  // Build full list: present workers + absent workers
  const presentEmpIds = useMemo(() => new Set(attendance.map((r) => r.emp_id)), [attendance])

  const fullList = useMemo(() => {
    const present = attendance.map((r) => ({
      emp_id: r.emp_id,
      worker_name: r.worker_name,
      contractor_name: r.contractor_name ?? "—",
      department: "—",
      designation: r.designation ?? "—",
      check_in: r.check_in,
      check_out: r.check_out,
      total_punches: r.total_punches,
      hours_worked: r.hours_worked,
      status: "Present" as const,
    }))

    const absent = allWorkers
      .filter((w) => !presentEmpIds.has(w.emp_id ?? ""))
      .map((w) => ({
        emp_id: w.emp_id ?? "—",
        worker_name: w.name,
        contractor_name: w.contractor_name ?? "—",
        department: w.department ?? "—",
        designation: w.designation ?? "—",
        check_in: null,
        check_out: null,
        total_punches: 0,
        hours_worked: null,
        status: "Not Present" as const,
      }))

    return [...present, ...absent]
  }, [attendance, allWorkers, presentEmpIds])

  // Unique filter options
  const contractors = useMemo(
    () => ["All", ...Array.from(new Set(fullList.map((r) => r.contractor_name).filter(Boolean)))],
    [fullList]
  )
  const departments = useMemo(
    () => ["All", ...Array.from(new Set(fullList.map((r) => r.department).filter((d) => d !== "—")))],
    [fullList]
  )

  const filtered = useMemo(() => {
    return fullList.filter((r) => {
      if (filterContractor !== "All" && r.contractor_name !== filterContractor) return false
      if (filterDepartment !== "All" && r.department !== filterDepartment) return false
      if (filterStatus !== "All" && r.status !== filterStatus) return false
      if (filterDirection === "In" && !r.check_in) return false
      if (filterDirection === "Out" && !r.check_out) return false
      return true
    })
  }, [fullList, filterContractor, filterDepartment, filterStatus, filterDirection])

  const presentCount = filtered.filter((r) => r.status === "Present").length
  const absentCount = filtered.filter((r) => r.status === "Not Present").length

  // Builds the full register: every active worker on every date in the range,
  // with the days they did not punch marked Absent.
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

      // Index punches by "empId|date" for O(1) lookup while walking the register
      const byKey = new Map(data.records.map((r) => [`${r.emp_id}|${r.date}`, r]))

      const dates: string[] = []
      for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0])
      }

      // Anyone who punched during the range but is no longer in the active list
      // (exited since, or a device ID with no worker record) still belongs in
      // the register - they worked those days.
      const activeIds = new Set(allWorkers.map((w) => w.emp_id))
      const extraWorkers = new Map<string, typeof allWorkers[number]>()
      for (const r of data.records) {
        if (activeIds.has(r.emp_id) || extraWorkers.has(r.emp_id)) continue
        extraWorkers.set(r.emp_id, {
          emp_id: r.emp_id,
          name: r.worker_name,
          contractor_name: r.contractor_name ?? "—",
          department: null,
          designation: r.designation ?? "—",
          status: "inactive",
        })
      }
      const registerWorkers = [...allWorkers, ...extraWorkers.values()]

      const rows = dates.flatMap((date) =>
        registerWorkers.map((w) => {
          const rec = byKey.get(`${w.emp_id}|${date}`)
          return {
            "Date": date,
            "Emp Code": w.emp_id || "—",
            "Name": w.name,
            "Contractor": w.contractor_name || "—",
            "Department": w.department || "—",
            "Designation": w.designation || "—",
            "Check In": rec?.check_in ?? "—",
            "Check Out": rec?.check_out ?? "—",
            "Total Punches": rec?.total_punches ?? 0,
            "Hours Worked": rec?.hours_worked ?? "—",
            "Status": rec ? "Present" : "Absent",
          }
        })
      )

      if (rows.length === 0) {
        toast.error("Nothing to export", { description: "No active workers found." })
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
      XLSX.writeFile(workbook, `attendance_${fromDate}_to_${toDate}.xlsx`)

      const present = rows.filter((r) => r.Status === "Present").length
      toast.success(`Downloaded ${rows.length.toLocaleString()} rows`, {
        description: `${dates.length} days · ${present.toLocaleString()} present · ${(rows.length - present).toLocaleString()} absent`,
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
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#3a8bfd] via-[#5d9ffc] to-[#8ab9fb] p-6 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Attendance Monitor
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Employee Punch Monitor</h2>
            <p className="mt-1 text-sm text-white/80">Real-time attendance from eSSL X2008 biometric device</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-white/70">Last updated: {lastRefreshed}</span>
            )}
            <Button
              variant="secondary"
              className="bg-white text-[#3a8bfd] shadow-md hover:bg-slate-100"
              onClick={() => fetchData(dateFilter)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={() => setExportOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white/70" />
              <p className="text-xs uppercase tracking-wide text-white/70">Total</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-300" />
              <p className="text-xs uppercase tracking-wide text-white/70">Present</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{presentCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-300" />
              <p className="text-xs uppercase tracking-wide text-white/70">Not Present</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-300">{absentCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-none bg-white shadow-xl">
        <CardContent className="flex flex-wrap items-end gap-4 px-6 py-5">
          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3a8bfd]"
            />
          </div>

          {/* Contractor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contractor</label>
            <select
              value={filterContractor}
              onChange={(e) => setFilterContractor(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3a8bfd]"
            >
              {contractors.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3a8bfd]"
            >
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last Punch Direction</label>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3a8bfd]"
            >
              <option>All</option>
              <option>In</option>
              <option>Out</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3a8bfd]"
            >
              <option>All</option>
              <option>Present</option>
              <option>Not Present</option>
            </select>
          </div>

          <Button
            className="bg-[#3a8bfd] text-white hover:bg-[#2c68d3]"
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Emp Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Emp Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Contractor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Punch Records</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[#3a8bfd]" />
                      Loading attendance data…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
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
                        <PunchDots count={row.total_punches} />
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
        workerCount={allWorkers.length}
        onExport={handleRangeExport}
      />
    </div>
  )
}

function PunchDots({ count }: { count: number }) {
  if (count === 0) return <span className="text-slate-300">—</span>
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-500" : i === count - 1 && count > 1 ? "bg-orange-400" : "bg-blue-300"}`}
        />
      ))}
      {count > 8 && <span className="text-xs text-slate-400">+{count - 8}</span>}
    </div>
  )
}
