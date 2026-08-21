"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Must match MAX_EXPORT_DAYS in backend/app/routers/attendance_routes.py
export const MAX_EXPORT_DAYS = 92

interface AttendanceExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Active worker count, used to preview how large the register will be */
  workerCount: number
  onExport: (fromDate: string, toDate: string) => Promise<void>
}

const today = () => new Date().toISOString().split("T")[0]

const daysBetween = (from: string, to: string) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1

export function AttendanceExportDialog({
  open,
  onOpenChange,
  workerCount,
  onExport,
}: AttendanceExportDialogProps) {
  const [fromDate, setFromDate] = useState(today())
  const [toDate, setToDate] = useState(today())
  const [exporting, setExporting] = useState(false)

  // Default to the current month-to-date each time the dialog is opened
  useEffect(() => {
    if (!open) return
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    setFromDate(first.toISOString().split("T")[0])
    setToDate(today())
    setExporting(false)
  }, [open])

  const span = useMemo(() => {
    if (!fromDate || !toDate) return 0
    return daysBetween(fromDate, toDate)
  }, [fromDate, toDate])

  const error = (() => {
    if (!fromDate || !toDate) return "Both dates are required"
    if (fromDate > toDate) return "From date cannot be after To date"
    if (toDate > today()) return "To date cannot be in the future"
    if (span > MAX_EXPORT_DAYS) {
      return `Range cannot exceed ${MAX_EXPORT_DAYS} days (selected ${span})`
    }
    return null
  })()

  const estimatedRows = span > 0 ? span * workerCount : 0

  const handleExport = async () => {
    if (error) return
    setExporting(true)
    try {
      await onExport(fromDate, toDate)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !exporting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Attendance</DialogTitle>
          <DialogDescription>
            Every active worker for every day in the range, with absences marked.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="from-date">From date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              max={toDate || today()}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              min={fromDate}
              max={today()}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {span} {span === 1 ? "day" : "days"} × {workerCount} workers ≈{" "}
            {estimatedRows.toLocaleString()} rows
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!!error || exporting}>
            {exporting ? "Preparing..." : "Download Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
