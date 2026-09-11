// Attendance rules shared by the HR and contractor attendance monitors
// (components/attendance-monitor.tsx). Kept free of React and "@/" imports so
// the logic can be exercised on its own.

/** One worker's punches for one day, as returned by /attendance/daily and /attendance/range. */
export interface AttendanceRecord {
  emp_id: string
  worker_name: string
  contractor_name: string | null
  designation: string | null
  /** Sent by backends that include it; older ones leave it out. */
  department?: string | null
  date: string
  check_in: string | null
  check_out: string | null
  total_punches: number
  hours_worked: number | null
}

/** An active (approved) worker - someone expected to punch in. */
export interface RosterWorker {
  emp_id: string | null
  name: string
  contractor_name: string | null
  department: string | null
  designation: string | null
}

export type AttendanceStatus = "Present" | "Not Present"
export type PunchDirection = "In" | "Out"

/** A row of the monitor table: a worker who punched, or an active worker who did not. */
export interface AttendanceRow {
  emp_id: string
  worker_name: string
  contractor_name: string
  department: string
  designation: string
  check_in: string | null
  check_out: string | null
  total_punches: number
  hours_worked: number | null
  last_direction: PunchDirection | null
  status: AttendanceStatus
}

export interface AttendanceFilters {
  contractor: string
  department: string
  direction: string
  status: string
}

export const ALL = "All"
/** Shown for a missing value. Also offered as a filter option, to find those rows. */
export const NONE = "—"

export const DEFAULT_FILTERS: AttendanceFilters = {
  contractor: ALL,
  department: ALL,
  direction: ALL,
  status: ALL,
}

export function formatTime(t: string | null) {
  if (!t) return NONE
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

/**
 * YYYY-MM-DD in the browser's timezone. toISOString() gives the UTC date,
 * which in IST is still the previous day until 05:30.
 */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Every date from `from` to `to` inclusive, as YYYY-MM-DD. */
export function dateRange(from: string, to: string): string[] {
  const dates: string[] = []
  const end = new Date(to)
  // Date-only strings parse as UTC midnight; stepping in UTC keeps the
  // sequence independent of the browser's timezone.
  for (const d = new Date(from); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

/**
 * Direction of a worker's last punch of the day. The device records every
 * punch as a check-out, so it is inferred instead: punches alternate in and
 * out starting with an entry, so an odd count means the worker is still in.
 */
export function lastPunchDirection(totalPunches: number): PunchDirection | null {
  if (totalPunches <= 0) return null
  return totalPunches % 2 === 1 ? "In" : "Out"
}

const orNone = (value: string | null | undefined) => value?.trim() || NONE

/**
 * Everyone who punched on the day, followed by the active workers who did not.
 * A present worker's details come from their current record on the roster; the
 * details sent with the punch only fill in for anyone not on it (exited, or a
 * device ID with no worker record). The attendance API looks workers up across
 * every status, so its copy can be an outdated duplicate.
 */
export function buildAttendanceRows(records: AttendanceRecord[], roster: RosterWorker[]): AttendanceRow[] {
  const rosterById = new Map<string, RosterWorker>()
  for (const w of roster) if (w.emp_id) rosterById.set(w.emp_id, w)

  const present = records.map((r): AttendanceRow => {
    const worker = rosterById.get(r.emp_id)
    return {
      emp_id: r.emp_id,
      worker_name: worker?.name || r.worker_name,
      contractor_name: orNone(worker?.contractor_name || r.contractor_name),
      department: orNone(worker?.department || r.department),
      designation: orNone(worker?.designation || r.designation),
      check_in: r.check_in,
      check_out: r.check_out,
      total_punches: r.total_punches,
      hours_worked: r.hours_worked,
      last_direction: lastPunchDirection(r.total_punches),
      status: "Present",
    }
  })

  const presentIds = new Set(records.map((r) => r.emp_id))
  const absent = roster
    .filter((w) => !w.emp_id || !presentIds.has(w.emp_id))
    .map((w): AttendanceRow => ({
      emp_id: w.emp_id || NONE,
      worker_name: w.name,
      contractor_name: orNone(w.contractor_name),
      department: orNone(w.department),
      designation: orNone(w.designation),
      check_in: null,
      check_out: null,
      total_punches: 0,
      hours_worked: null,
      last_direction: null,
      status: "Not Present",
    }))

  return [...present, ...absent]
}

/**
 * Values that differ only in case or spacing are treated as one: the worker
 * sheets hold "Packing", "packing" and "PACKING" alike.
 */
const matchKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase()

/**
 * "All", then each distinct value of `key` alphabetically, then "—" if some
 * rows have none. Case and spacing variants are offered once, under their
 * most common spelling.
 */
export function filterOptions(rows: AttendanceRow[], key: "contractor_name" | "department"): string[] {
  const spellings = new Map<string, Map<string, number>>()
  let hasNone = false
  for (const row of rows) {
    const value = row[key]
    if (value === NONE) {
      hasNone = true
      continue
    }
    const k = matchKey(value)
    const counts = spellings.get(k) ?? new Map<string, number>()
    counts.set(value, (counts.get(value) ?? 0) + 1)
    spellings.set(k, counts)
  }
  const labels = Array.from(spellings.values(), (counts) =>
    // Most common spelling; the first one seen wins a tie
    Array.from(counts).reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0]
  )
  return [ALL, ...labels.sort((a, b) => a.localeCompare(b)), ...(hasNone ? [NONE] : [])]
}

const matches = (value: string, choice: string) => choice === ALL || matchKey(value) === matchKey(choice)

export function filterAttendanceRows(rows: AttendanceRow[], filters: AttendanceFilters): AttendanceRow[] {
  return rows.filter(
    (r) =>
      matches(r.contractor_name, filters.contractor) &&
      matches(r.department, filters.department) &&
      (filters.direction === ALL || r.last_direction === filters.direction) &&
      (filters.status === ALL || r.status === filters.status)
  )
}

/** One row of the exported register; keys are the spreadsheet's column headers. */
export interface RegisterRow {
  "Date": string
  "Emp Code": string
  "Name": string
  "Contractor": string
  "Department": string
  "Designation": string
  "Check In": string
  "Check Out": string
  "Total Punches": number
  "Hours Worked": number | string
  "Status": "Present" | "Absent"
}

/**
 * The full register: every active worker on every date in the range, with the
 * days they did not punch marked Absent. Anyone who punched during the range
 * but is not on the roster (exited since, or a device ID with no worker
 * record) is included too - they worked those days.
 */
export function buildAttendanceRegister(
  records: AttendanceRecord[],
  roster: RosterWorker[],
  fromDate: string,
  toDate: string,
): { rows: RegisterRow[]; days: number } {
  // Index punches by "empId|date" for O(1) lookup while walking the register
  const byKey = new Map(records.map((r) => [`${r.emp_id}|${r.date}`, r]))

  const rosterIds = new Set(roster.map((w) => w.emp_id))
  const outsideRoster = new Map<string, RosterWorker>()
  for (const r of records) {
    if (rosterIds.has(r.emp_id) || outsideRoster.has(r.emp_id)) continue
    outsideRoster.set(r.emp_id, {
      emp_id: r.emp_id,
      name: r.worker_name,
      contractor_name: r.contractor_name,
      department: r.department ?? null,
      designation: r.designation,
    })
  }
  const workers = [...roster, ...outsideRoster.values()]
  const dates = dateRange(fromDate, toDate)

  const rows = dates.flatMap((date) =>
    workers.map((w): RegisterRow => {
      const rec = w.emp_id ? byKey.get(`${w.emp_id}|${date}`) : undefined
      return {
        "Date": date,
        "Emp Code": w.emp_id || NONE,
        "Name": w.name,
        "Contractor": w.contractor_name || NONE,
        "Department": w.department || NONE,
        "Designation": w.designation || NONE,
        "Check In": rec?.check_in ?? NONE,
        "Check Out": rec?.check_out ?? NONE,
        "Total Punches": rec?.total_punches ?? 0,
        "Hours Worked": rec?.hours_worked ?? NONE,
        "Status": rec ? "Present" : "Absent",
      }
    })
  )

  return { rows, days: dates.length }
}
