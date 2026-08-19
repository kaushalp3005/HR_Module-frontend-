"use client"

import { useEffect, useState } from "react"

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

export interface ExitWorkerTarget {
  id: string
  name: string
  emp_id?: string
  date_of_joining?: string
}

interface ExitWorkerDialogProps {
  worker: ExitWorkerTarget | null
  onCancel: () => void
  onConfirm: (workerId: string, resignedDate: string) => Promise<void>
}

const today = () => new Date().toISOString().split("T")[0]

export function ExitWorkerDialog({ worker, onCancel, onConfirm }: ExitWorkerDialogProps) {
  const [resignedDate, setResignedDate] = useState(today())
  const [submitting, setSubmitting] = useState(false)

  // Reset to today each time the dialog opens for a different worker
  useEffect(() => {
    if (worker) {
      setResignedDate(today())
      setSubmitting(false)
    }
  }, [worker])

  // Mirrors the backend rules so the user sees the problem before submitting
  const error = (() => {
    if (!resignedDate) return "Resigned date is required"
    if (resignedDate > today()) return "Resigned date cannot be in the future"
    if (worker?.date_of_joining && resignedDate < worker.date_of_joining) {
      return `Resigned date cannot be before the joining date (${worker.date_of_joining})`
    }
    return null
  })()

  const handleConfirm = async () => {
    if (!worker || error) return
    setSubmitting(true)
    try {
      await onConfirm(worker.id, resignedDate)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!worker} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exit Worker</DialogTitle>
          <DialogDescription>
            {worker?.name}
            {worker?.emp_id ? ` (${worker.emp_id})` : ""} will be moved to the Exited list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="resigned-date">
            Resigned date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="resigned-date"
            type="date"
            value={resignedDate}
            max={today()}
            min={worker?.date_of_joining}
            onChange={(e) => setResignedDate(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!!error || submitting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {submitting ? "Exiting..." : "Confirm Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
