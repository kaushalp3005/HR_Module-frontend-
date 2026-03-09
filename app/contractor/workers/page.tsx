"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { useAppStore } from "@/lib/store"
import { getWorkers, deleteWorker as deleteWorkerAPI } from "@/lib/api"
import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { ResponsiveTable } from "@/components/responsive-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit2, Trash2, Plus, Upload } from "lucide-react"

interface Worker {
  id: string  // Changed to string to match ResponsiveTable requirements
  emp_id: string
  name: string
  phone: string
  designation: string
  department: string
  work_location: string
  date_of_joining: string
  status: string
  contractor_id: string
}

const WAREHOUSES = [
  { key: "all", label: "All" },
  { key: "W-202", label: "W-202" },
  { key: "A-185", label: "A-185" },
  { key: "A-68", label: "A-68" },
  { key: "HOH-101", label: "HOH-101" },
]

export default function ContractorWorkersPage() {
  const user = useAppStore((state) => state.user)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")

  // Fetch workers from API
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true)
        const data = await getWorkers({ contractor_id: user?.contractorId })
        
        // Convert id to string for ResponsiveTable compatibility
        const workersWithStringId = data.map((w: any) => ({
          ...w,
          id: String(w.id)
        }))
        setWorkers(workersWithStringId)
      } catch (error) {
        console.error("Failed to fetch workers:", error)
        toast.error("Failed to load workers")
      } finally {
        setLoading(false)
      }
    }

    if (user?.contractorId) {
      fetchWorkers()
    }
  }, [user?.contractorId])

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      try {
        await deleteWorkerAPI(Number(id))
        setWorkers(workers.filter((w) => w.id !== id))
        toast.success("Worker deleted successfully")
      } catch (error) {
        console.error("Failed to delete worker:", error)
        toast.error("Failed to delete worker")
      }
    }
  }

  const filteredWorkers = selectedWarehouse === "all"
    ? workers
    : workers.filter(w => w.work_location?.toUpperCase().includes(selectedWarehouse.toUpperCase()))

  const columns = [
    {
      key: "emp_id" as const,
      label: "Emp ID",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "name" as const,
      label: "Worker Name",
      render: (value: string) => <span className="font-medium text-sm sm:text-base">{value}</span>,
    },
    {
      key: "phone" as const,
      label: "Phone",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "designation" as const,
      label: "Designation",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "department" as const,
      label: "Department",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "work_location" as const,
      label: "Work Location",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "date_of_joining" as const,
      label: "Joining Date",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
      hidden: true,
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: string) => (
        <Badge
          variant={value === "approved" ? "default" : value === "pending" ? "secondary" : "destructive"}
          className="text-xs sm:text-sm"
        >
          {value}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Added Workers"
        subtitle={`${filteredWorkers.length} workers`}
        actions={
          <div className="flex gap-2">
            <Button asChild className="gap-2 text-xs sm:text-sm" variant="outline">
              <Link href="/contractor/workers-status">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View by Status</span>
                <span className="sm:hidden">Status</span>
              </Link>
            </Button>
            <Button asChild className="gap-2 text-xs sm:text-sm">
              <Link href="/contractor/workers/add">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Worker</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Warehouse Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {WAREHOUSES.map((wh) => {
          const count = wh.key === "all"
            ? workers.length
            : workers.filter(w => w.work_location?.toUpperCase().includes(wh.key.toUpperCase())).length
          return (
            <button
              key={wh.key}
              onClick={() => setSelectedWarehouse(wh.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedWarehouse === wh.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {wh.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedWarehouse === wh.key
                  ? "bg-primary-foreground/20"
                  : "bg-background"
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No workers found.</div>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={filteredWorkers}
              actions={(row: Worker) => (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    title="Edit Worker"
                    asChild
                  >
                    <Link href={`/contractor/workers/edit/${row.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(row.id)}
                    title="Delete Worker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
            )}
          />
        )}
      </div>
    </div>
  )
}
