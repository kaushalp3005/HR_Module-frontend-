"use client"

import { useState, useEffect } from "react"
import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { API_BASE_URL } from "@/lib/api"
import { ResponsiveTable } from "@/components/responsive-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Edit2, Trash2, User, Phone, MapPin, Calendar, Briefcase, Building, Hash, Search, LogOut, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import * as XLSX from "xlsx"

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
  resigned_date?: string
  email?: string
  gender?: string
  date_of_birth?: string
  floor?: string
  aadhaar?: string
  pan?: string
  uan_number?: string
  esi_number?: string
  address?: string
  permanent_address?: string
  bank_name?: string
  bank_ac?: string
  ifsc_code?: string
  emergency_contact_number?: string
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
  const [activeTab, setActiveTab] = useState("approved")

  // Fetch all workers
  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`)
      if (!response.ok) {
        throw new Error("Failed to fetch workers")
      }
      const data = await response.json()
      const workersWithStringId = data.map((worker: any) => ({
        ...worker,
        id: worker.id.toString()
      }))
      setWorkers(workersWithStringId)
    } catch (error: any) {
      console.error("Error fetching workers:", error)
      toast.error("Failed to Load Workers", {
        description: error.message || "Could not fetch workers."
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

      fetchWorkers()
    } catch (error: any) {
      console.error("Error deleting worker:", error)
      toast.error("Failed to Delete Worker", {
        description: error.message || "Could not delete worker.",
        id: toastId
      })
    }
  }

  const filteredWorkers = workers.filter(w => {
    const statusMatch = activeTab === "approved" ? w.status === "approved" : w.status === "exit"
    const warehouseMatch = selectedWarehouse === "all" || w.work_location?.toUpperCase().includes(selectedWarehouse.toUpperCase())
    const query = searchQuery.toLowerCase().trim()
    const searchMatch = !query ||
      w.name?.toLowerCase().includes(query) ||
      w.emp_id?.toLowerCase().includes(query) ||
      w.phone?.toLowerCase().includes(query)
    return statusMatch && warehouseMatch && searchMatch
  })

  const counts = {
    approved: workers.filter(w => w.status === "approved").length,
    exit: workers.filter(w => w.status === "exit").length,
  }

  const approvedColumns = [
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

  const exitColumns = [
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
      key: "work_location" as const,
      label: "Work Location",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "resigned_date" as const,
      label: "Resigned Date",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "status" as const,
      label: "Status",
      render: () => (
        <Badge variant="secondary" className="text-xs sm:text-sm bg-orange-500 text-white hover:bg-orange-600">
          Exit
        </Badge>
      ),
    },
  ]

  const handleDownloadExcel = () => {
    const dataToExport = filteredWorkers.map((worker) => ({
      "Emp ID": worker.emp_id || "N/A",
      "Name": worker.name,
      "Phone": worker.phone,
      "Email": worker.email || "N/A",
      "Gender": worker.gender || "N/A",
      "Date of Birth": worker.date_of_birth || "N/A",
      "Designation": worker.designation,
      "Department": worker.department || "N/A",
      "Work Location": worker.work_location || "N/A",
      "Floor": worker.floor || "N/A",
      "Date of Joining": worker.date_of_joining || "N/A",
      "Contractor Name": worker.contractor_name || "N/A",
      "Aadhaar": worker.aadhaar || "N/A",
      "PAN": worker.pan || "N/A",
      "UAN Number": worker.uan_number || "N/A",
      "ESI Number": worker.esi_number || "N/A",
      "Bank Name": worker.bank_name || "N/A",
      "Bank A/C": worker.bank_ac || "N/A",
      "IFSC Code": worker.ifsc_code || "N/A",
      "Emergency Contact": worker.emergency_contact_number || "N/A",
      "Address": worker.address || "N/A",
      "Permanent Address": worker.permanent_address || "N/A",
      "Status": worker.status,
      ...(worker.status === "exit" ? { "Resigned Date": worker.resigned_date || "N/A" } : {}),
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    const sheetName = activeTab === "approved" ? "Active Workers" : "Exited Workers"
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const fileName = `workers_${activeTab}_${selectedWarehouse === "all" ? "all_locations" : selectedWarehouse}_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    toast.success(`Downloaded ${dataToExport.length} workers data`)
  }

  const getStatusForTab = (tab: string) => {
    return tab === "approved" ? "approved" : "exit"
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Workers"
        subtitle={`${counts.approved} active workers | ${counts.exit} exited workers`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
            Active Workers ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="exit" className="text-xs sm:text-sm">
            Exited Workers ({counts.exit})
          </TabsTrigger>
        </TabsList>

        {/* Warehouse Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {WAREHOUSES.map((wh) => {
            const currentStatus = getStatusForTab(activeTab)
            const count = wh.key === "all"
              ? workers.filter(w => w.status === currentStatus).length
              : workers.filter(w => w.status === currentStatus && w.work_location?.toUpperCase().includes(wh.key.toUpperCase())).length
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

        {/* Search Bar + Export */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, emp ID, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleDownloadExcel}
            className="gap-2 text-xs sm:text-sm"
            variant="outline"
            disabled={filteredWorkers.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </Button>
        </div>

        <TabsContent value="approved" className="mt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No approved workers found.</div>
            ) : (
              <ResponsiveTable
                columns={approvedColumns}
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
        </TabsContent>

        <TabsContent value="exit" className="mt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No exited workers found.</div>
            ) : (
              <ResponsiveTable
                columns={exitColumns}
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
                  </div>
                )}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Worker Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Worker Details
              {selectedWorker && (
                <Badge
                  variant={selectedWorker.status === "approved" ? "default" : "secondary"}
                  className={selectedWorker.status === "exit" ? "bg-orange-500 text-white" : ""}
                >
                  {selectedWorker.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedWorker && (
            <div className="space-y-6">
              {/* Exit Info */}
              {selectedWorker.status === "exit" && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-600 mb-2">Worker Exited</h3>
                  <p className="text-sm text-muted-foreground">Resigned Date: {selectedWorker.resigned_date || "N/A"}</p>
                </div>
              )}

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

                  {selectedWorker.status === "exit" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LogOut className="w-4 h-4" />
                        Last Working Day
                      </div>
                      <div className="font-medium text-orange-600">{selectedWorker.resigned_date || "N/A"}</div>
                    </div>
                  )}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
