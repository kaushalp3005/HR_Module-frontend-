"use client"

import { useState, useEffect } from "react"
import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { API_BASE_URL } from "@/lib/api"
import { ResponsiveTable } from "@/components/responsive-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Edit2, Trash2, User, Phone, MapPin, Calendar, Briefcase, Building, Hash, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type Worker = {
  id: string
  emp_id: string
  name: string
  designation: string
  department: string
  contractor_id: string
  contractor_name: string
  status: string
  phone: string
  work_location: string
  date_of_joining: string
}

const WAREHOUSES = [
  { key: "all", label: "All" },
  { key: "W-202", label: "W-202" },
  { key: "A-185", label: "A-185" },
  { key: "A-68", label: "A-68" },
  { key: "HOH-101", label: "HOH-101" },
]

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch approved workers only
  useEffect(() => {
    fetchApprovedWorkers()
  }, [])

  const fetchApprovedWorkers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers?status=approved`)
      if (!response.ok) {
        throw new Error("Failed to fetch approved workers")
      }
      const data = await response.json()
      // Convert id to string for table compatibility
      const workersWithStringId = data.map((worker: any) => ({
        ...worker,
        id: worker.id.toString()
      }))
      setWorkers(workersWithStringId)
    } catch (error: any) {
      console.error("Error fetching approved workers:", error)
      toast.error("Failed to Load Workers", {
        description: error.message || "Could not fetch approved workers."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return
    }

    const toastId = toast.loading("Deleting worker...")
    
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete worker")
      }

      toast.success("Worker Deleted Successfully!", {
        id: toastId
      })

      // Refresh the list
      fetchApprovedWorkers()
    } catch (error: any) {
      console.error("Error deleting worker:", error)
      toast.error("Failed to Delete Worker", {
        description: error.message || "Could not delete worker.",
        id: toastId
      })
    }
  }

  const filteredWorkers = workers.filter(w => {
    const warehouseMatch = selectedWarehouse === "all" || w.work_location?.toUpperCase().includes(selectedWarehouse.toUpperCase())
    const query = searchQuery.toLowerCase().trim()
    const searchMatch = !query ||
      w.name?.toLowerCase().includes(query) ||
      w.emp_id?.toLowerCase().includes(query) ||
      w.phone?.toLowerCase().includes(query)
    return warehouseMatch && searchMatch
  })

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
      label: "Phone Number",
      render: (value: string) => <span className="text-xs sm:text-sm font-mono">{value}</span>,
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
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Total Workers (Active)"
        subtitle={`${filteredWorkers.length} active workers in the system`}
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, emp ID, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No approved workers found.</div>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={filteredWorkers}
            actions={(row) => (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleViewWorker(row)}
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(row.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          />
        )}
      </div>

      {/* Worker Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Worker Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorker && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="w-4 h-4" />
                      Employee ID
                    </div>
                    <div className="font-medium">{selectedWorker.emp_id || "N/A"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      Full Name
                    </div>
                    <div className="font-medium">{selectedWorker.name}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </div>
                    <div className="font-medium">{selectedWorker.phone}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Date of Joining
                    </div>
                    <div className="font-medium">{selectedWorker.date_of_joining || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Work Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      Designation
                    </div>
                    <div className="font-medium">{selectedWorker.designation}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      Department
                    </div>
                    <div className="font-medium">{selectedWorker.department || "N/A"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Work Location
                    </div>
                    <div className="font-medium">{selectedWorker.work_location || "N/A"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      Contractor
                    </div>
                    <div className="font-medium">{selectedWorker.contractor_name}</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Status</h3>
                
                <div className="flex items-center gap-2">
                  <Badge variant={selectedWorker.status === "approved" ? "default" : "secondary"}>
                    {selectedWorker.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
