"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { useAppStore } from "@/lib/store"
import { getWorkers, exitWorker as exitWorkerAPI, retainWorker as retainWorkerAPI } from "@/lib/api"
import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { ResponsiveTable } from "@/components/responsive-table"
import { ExitWorkerDialog, type ExitWorkerTarget } from "@/components/exit-worker-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Eye, Edit2, Trash2, Plus, Upload, User, Phone, Mail, Calendar, MapPin, Building, IdCard, FileText, Search, LogOut, Download, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import * as XLSX from "xlsx"

interface Worker {
  id: string  // Changed to string to match ResponsiveTable requirements
  emp_id?: string
  old_employee_id?: string
  sr_no?: number
  title?: string
  name: string
  gender?: string
  date_of_birth?: string
  phone: string
  email?: string
  emergency_contact_number?: string
  emrcy_p_nm?: string
  resp?: string
  emrcy_con_no?: string
  designation: string
  designation_other?: string
  department?: string
  department_other?: string
  work_location?: string
  work_location_other?: string
  floor?: string
  floor_other?: string
  date_of_joining?: string
  uan_number?: string
  esi_number?: string
  address?: string
  currently_staying_type?: string
  permanent_address?: string
  rental_address?: string
  pin_code?: string
  bank_name?: string
  bank_ac?: string
  ifsc_code?: string
  aprn_size?: string
  apron_locker_no?: string
  ftwr_size?: string
  mdcl?: string
  remark?: string
  contractor_id: string
  contractor_name?: string
  status: string
  aadhaar?: string
  pan?: string
  passport_photo_url?: string
  aadhaar_photo_url?: string
  pan_photo_url?: string
  rejection_reason?: string
  created_at?: string
  updated_at?: string
  approved_by?: string
  approved_at?: string
  resigned_date?: string
}

const WAREHOUSES = [
  { key: "all", label: "All" },
  { key: "W-202", label: "W-202" },
  { key: "A-185", label: "A-185" },
  { key: "A-68", label: "A-68" },
  { key: "HOH-101", label: "HOH-101" },
]

export default function WorkersStatusPage() {
  const user = useAppStore((state) => state.user)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("approved")
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [exitTarget, setExitTarget] = useState<ExitWorkerTarget | null>(null)

  // Fetch workers from API
  useEffect(() => {
    fetchWorkers()
  }, [user])

  const fetchWorkers = async () => {
    if (!user?.contractorId) {
      setLoading(false)
      return
    }

    try {
      // Fetch ALL workers (no contractor filter) - shows all approved workers from all contractors
      const data = await getWorkers()

      // Convert id to string for ResponsiveTable
      const allWorkers = data.map((worker: any) => ({
        ...worker,
        id: worker.id.toString() // Convert to string for ResponsiveTable
      }))

      setWorkers(allWorkers)
    } catch (error) {
      console.error("Failed to fetch workers:", error)
      toast.error("Failed to load workers")
    } finally {
      setLoading(false)
    }
  }

  const handleExitConfirm = async (id: string, resignedDate: string) => {
    try {
      await exitWorkerAPI(Number(id), resignedDate)
      toast.success("Worker marked as exited successfully")
      setExitTarget(null)
      fetchWorkers()
    } catch (error) {
      console.error("Failed to exit worker:", error)
      toast.error(error instanceof Error ? error.message : "Failed to exit worker")
    }
  }

  const handleRetain = async (id: string) => {
    if (confirm("Are you sure you want to retain this worker? It will be sent for HR approval.")) {
      try {
        await retainWorkerAPI(Number(id))
        toast.success("Retain request sent for HR approval")
        fetchWorkers()
      } catch (error) {
        console.error("Failed to retain worker:", error)
        toast.error("Failed to retain worker")
      }
    }
  }

  // Columns for approved workers (full details)
  const approvedColumns = [
    {
      key: "emp_id" as const,
      width: "10%",
      label: "Emp ID",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "name" as const,
      width: "19%",
      label: "Worker Name",
      render: (value: string) => <span className="font-medium text-sm sm:text-base">{value}</span>,
    },
    {
      key: "phone" as const,
      width: "11%",
      label: "Phone",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "designation" as const,
      width: "11%",
      label: "Designation",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "department" as const,
      width: "12%",
      label: "Department",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "work_location" as const,
      width: "14%",
      label: "Work Location",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "date_of_joining" as const,
      width: "10%",
      label: "Joining Date",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
      hidden: true,
    },
    {
      key: "status" as const,
      width: "9%",
      label: "Status",
      render: (value: string) => (
        <Badge variant="default" className="text-xs sm:text-sm bg-green-600 hover:bg-green-700">
          {value}
        </Badge>
      ),
    },
  ]

  // Columns for rejected workers (only specific fields)
  const rejectedColumns = [
    {
      key: "emp_id" as const,
      width: "11%",
      label: "Emp ID",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "name" as const,
      width: "20%",
      label: "Worker Name",
      render: (value: string) => <span className="font-medium text-sm sm:text-base">{value}</span>,
    },
    {
      key: "phone" as const,
      width: "12%",
      label: "Phone",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "designation" as const,
      width: "13%",
      label: "Designation",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "status" as const,
      width: "10%",
      label: "Status",
      render: (value: string) => (
        <Badge variant="destructive" className="text-xs sm:text-sm">
          {value}
        </Badge>
      ),
    },
    {
      key: "rejection_reason" as const,
      width: "26%",
      label: "Rejection Reason",
      render: (value: string) => (
        <div className="whitespace-normal break-words">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {value || "No reason provided"}
          </span>
        </div>
      ),
    },
  ]

  // Columns for exited workers
  const exitColumns = [
    {
      key: "emp_id" as const,
      width: "10%",
      label: "Emp ID",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "name" as const,
      width: "20%",
      label: "Worker Name",
      render: (value: string) => <span className="font-medium text-sm sm:text-base">{value}</span>,
    },
    {
      key: "phone" as const,
      width: "11%",
      label: "Phone",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "designation" as const,
      width: "12%",
      label: "Designation",
      render: (value: string) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "work_location" as const,
      width: "15%",
      label: "Work Location",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "resigned_date" as const,
      width: "11%",
      label: "Resigned Date",
      render: (value: string) => <span className="text-xs sm:text-sm">{value || "N/A"}</span>,
    },
    {
      key: "status" as const,
      width: "9%",
      label: "Status",
      render: () => (
        <Badge variant="secondary" className="text-xs sm:text-sm bg-orange-500 text-white hover:bg-orange-600">
          Exit
        </Badge>
      ),
    },
  ]

  // Filter workers based on active tab, warehouse, and search query
  const filteredWorkers = workers.filter(worker => {
    const statusMatch = activeTab === "approved"
      ? worker.status === "approved"
      : activeTab === "rejected"
        ? worker.status === "rejected"
        : worker.status === "exit"
    const warehouseMatch = selectedWarehouse === "all" || (worker.work_location?.toUpperCase().includes(selectedWarehouse.toUpperCase()))
    const query = searchQuery.toLowerCase().trim()
    const searchMatch = !query ||
      worker.name?.toLowerCase().includes(query) ||
      worker.emp_id?.toLowerCase().includes(query) ||
      worker.phone?.toLowerCase().includes(query)
    return statusMatch && warehouseMatch && searchMatch
  })

  // Count workers by status
  const counts = {
    all: workers.length,
    pending: workers.filter(w => w.status === "pending").length,
    approved: workers.filter(w => w.status === "approved").length,
    rejected: workers.filter(w => w.status === "rejected").length,
    exit: workers.filter(w => w.status === "exit").length,
  }

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
      "Address": worker.address || "N/A",
      "Permanent Address": worker.permanent_address || "N/A",
      "Status": worker.status,
      ...(worker.status === "rejected" ? { "Rejection Reason": worker.rejection_reason || "N/A" } : {}),
      ...(worker.status === "exit" ? { "Resigned Date": worker.resigned_date || "N/A" } : {}),
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    const sheetName = activeTab === "approved" ? "Approved Workers" : activeTab === "rejected" ? "Rejected Workers" : "Exited Workers"
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const fileName = `workers_${activeTab}_${selectedWarehouse === "all" ? "all_locations" : selectedWarehouse}_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    toast.success(`Downloaded ${dataToExport.length} workers data`)
  }

  // Helper functions for dynamic field rendering (same as HR approval page)
  const getPersonalInfoFields = (worker: Worker) => {
    const fields = [
      { label: "Full Name", value: worker.name, icon: null },
      { label: "Title", value: worker.title, icon: null },
      { label: "Employee ID", value: worker.emp_id, icon: null },
      { label: "Old Employee ID", value: worker.old_employee_id, icon: null },
      { label: "Sr. No.", value: worker.sr_no?.toString(), icon: null },
      { label: "Gender", value: worker.gender, icon: null },
      { label: "Date of Birth", value: worker.date_of_birth, icon: <Calendar className="w-3 h-3" /> },
      { label: "Phone Number", value: worker.phone, icon: <Phone className="w-3 h-3" /> },
      { label: "Email Address", value: worker.email, icon: <Mail className="w-3 h-3" /> },
      { label: "Date of Joining", value: worker.date_of_joining, icon: <Calendar className="w-3 h-3" /> },
      { label: "Application Date", value: worker.created_at ? new Date(worker.created_at).toLocaleDateString() : null, icon: <Calendar className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getEmergencyContactFields = (worker: Worker) => {
    const fields = [
      { label: "Emergency Contact Number", value: worker.emergency_contact_number, icon: <Phone className="w-3 h-3" /> },
      { label: "Emergency Person Name", value: worker.emrcy_p_nm, icon: <User className="w-3 h-3" /> },
      { label: "Relationship", value: worker.resp, icon: null },
      { label: "Alternate Emergency Number", value: worker.emrcy_con_no, icon: <Phone className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getWorkInfoFields = (worker: Worker) => {
    const fields = [
      { label: "Designation", value: worker.designation, icon: null },
      { label: "Designation (Other)", value: worker.designation_other, icon: null },
      { label: "Department", value: worker.department, icon: null },
      { label: "Department (Other)", value: worker.department_other, icon: null },
      { label: "Work Location", value: worker.work_location, icon: <MapPin className="w-3 h-3" /> },
      { label: "Work Location (Other)", value: worker.work_location_other, icon: <MapPin className="w-3 h-3" /> },
      { label: "Floor", value: worker.floor, icon: null },
      { label: "Floor (Other)", value: worker.floor_other, icon: null },
      { label: "Contractor", value: worker.contractor_name, icon: null },
      { label: "Contractor ID", value: worker.contractor_id, icon: null },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getGovernmentIdFields = (worker: Worker) => {
    const fields = [
      { label: "Aadhaar Number", value: worker.aadhaar, icon: <IdCard className="w-3 h-3" /> },
      { label: "PAN Number", value: worker.pan, icon: <IdCard className="w-3 h-3" /> },
      { label: "UAN Number", value: worker.uan_number, icon: <IdCard className="w-3 h-3" /> },
      { label: "ESI Number", value: worker.esi_number, icon: <IdCard className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getAddressFields = (worker: Worker) => {
    const fields = [
      { label: "Current Address", value: worker.address, icon: <MapPin className="w-3 h-3" /> },
      { label: "Staying Type", value: worker.currently_staying_type, icon: null },
      { label: "Permanent Address", value: worker.permanent_address, icon: <MapPin className="w-3 h-3" /> },
      { label: "Rental Address", value: worker.rental_address, icon: <MapPin className="w-3 h-3" /> },
      { label: "PIN Code", value: worker.pin_code, icon: null },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getBankingFields = (worker: Worker) => {
    const fields = [
      { label: "Bank Name", value: worker.bank_name, icon: null },
      { label: "Account Number", value: worker.bank_ac, icon: null },
      { label: "IFSC Code", value: worker.ifsc_code, icon: null },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getAdditionalFields = (worker: Worker) => {
    const fields = [
      { label: "Apron Size", value: worker.aprn_size, icon: null },
      { label: "Apron Locker No.", value: worker.apron_locker_no, icon: null },
      { label: "Footwear Size", value: worker.ftwr_size, icon: null },
      { label: "Medical Status", value: worker.mdcl, icon: null },
      { label: "Remark", value: worker.remark, icon: null },
      { label: "Resigned Date", value: worker.resigned_date, icon: <Calendar className="w-3 h-3" /> },
      { label: "Approved By", value: worker.approved_by, icon: null },
      { label: "Approved At", value: worker.approved_at ? new Date(worker.approved_at).toLocaleString() : null, icon: <Calendar className="w-3 h-3" /> },
      { label: "Last Updated", value: worker.updated_at ? new Date(worker.updated_at).toLocaleString() : null, icon: <Calendar className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  // Get the current tab's status for warehouse filter counting
  const getStatusForTab = (tab: string) => {
    if (tab === "approved") return "approved"
    if (tab === "rejected") return "rejected"
    return "exit"
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Workers Status"
        subtitle="View approved, rejected and exited workers"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleDownloadExcel} className="gap-2 text-xs sm:text-sm" variant="outline" disabled={filteredWorkers.length === 0}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
            <Button asChild className="gap-2 text-xs sm:text-sm" variant="outline">
              <Link href="/contractor/workers">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View All Workers</span>
                <span className="sm:hidden">All</span>
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
           All Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="exit" className="text-xs sm:text-sm">
            Exited ({counts.exit})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        {/* Warehouse Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {WAREHOUSES.map((wh) => {
            const currentStatus = getStatusForTab(activeTab)
            const count = wh.key === "all"
              ? workers.filter(w => w.status === currentStatus).length
              : workers.filter(w => {
                  return w.status === currentStatus && w.work_location?.toUpperCase().includes(wh.key.toUpperCase())
                }).length
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

        <TabsContent value="approved" className="mt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No approved workers found.
              </div>
            ) : (
              <ResponsiveTable
                columns={approvedColumns}
                data={filteredWorkers}
                fitWidth
                actionsWidth="14%"
                actions={(row: Worker) => (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View Details"
                      onClick={() => setSelectedWorker(row)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => setExitTarget(row)}
                      title="Exit Worker"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Exit</span>
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
              <div className="p-8 text-center text-muted-foreground">
                No exited workers found.
              </div>
            ) : (
              <ResponsiveTable
                columns={exitColumns}
                data={filteredWorkers}
                fitWidth
                actionsWidth="12%"
                actions={(row: Worker) => (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View Details"
                      onClick={() => setSelectedWorker(row)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleRetain(row.id)}
                      title="Retain Worker"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      <span className="text-xs">Retain</span>
                    </Button>
                  </div>
                )}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No rejected workers found.
              </div>
            ) : (
              <ResponsiveTable
                columns={rejectedColumns}
                data={filteredWorkers}
                fitWidth
                actionsWidth="8%"
                actions={(row: Worker) => (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View Details"
                      onClick={() => setSelectedWorker(row)}
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
      {selectedWorker && (
        <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Worker Details - {selectedWorker.name}
                <Badge
                  variant={selectedWorker.status === "approved" ? "default" : selectedWorker.status === "exit" ? "secondary" : "destructive"}
                  className={`ml-2 ${selectedWorker.status === "exit" ? "bg-orange-500 text-white" : ""}`}
                >
                  {selectedWorker.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedWorker.status === "rejected"
                  ? "This worker application was rejected by HR. View details and rejection reason below."
                  : selectedWorker.status === "exit"
                    ? `This worker has exited. Resigned date: ${selectedWorker.resigned_date || "N/A"}`
                    : "Complete worker information and current status."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Exit Info - Show prominently if exited */}
              {selectedWorker.status === "exit" && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-600 mb-2">Worker Exited</h3>
                  <p className="text-sm text-muted-foreground">Resigned Date: {selectedWorker.resigned_date || "N/A"}</p>
                </div>
              )}

              {/* Rejection Reason - Show prominently if rejected */}
              {selectedWorker.status === "rejected" && selectedWorker.rejection_reason && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-destructive mb-2">Rejection Reason</h3>
                  <p className="text-sm text-muted-foreground">{selectedWorker.rejection_reason}</p>
                  {selectedWorker.approved_by && (
                    <p className="text-xs text-muted-foreground mt-2">Rejected by: {selectedWorker.approved_by}</p>
                  )}
                </div>
              )}

              {/* Personal Information */}
              {getPersonalInfoFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPersonalInfoFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {getEmergencyContactFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getEmergencyContactFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Information */}
              {getWorkInfoFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Work Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getWorkInfoFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Government IDs */}
              {getGovernmentIdFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IdCard className="w-4 h-4" />
                    Government IDs & Numbers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getGovernmentIdFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium font-mono flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Information */}
              {getAddressFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {getAddressFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium flex items-start gap-1">
                          {field.icon}
                          <span>{field.value}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Banking Information */}
              {getBankingFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Banking Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getBankingFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium font-mono flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {getAdditionalFields(selectedWorker).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAdditionalFields(selectedWorker).map((field, index) => (
                      <div key={index}>
                        <Label className="text-muted-foreground">{field.label}</Label>
                        <p className="font-medium flex items-center gap-1">
                          {field.icon}
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Photos */}
              {(selectedWorker.passport_photo_url || selectedWorker.aadhaar_photo_url || selectedWorker.pan_photo_url) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Document Photos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedWorker.passport_photo_url && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Passport Photo</Label>
                        <div className="relative aspect-3/4 border rounded-lg overflow-hidden">
                          <Image
                            src={selectedWorker.passport_photo_url}
                            alt="Passport Photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {selectedWorker.aadhaar_photo_url && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Aadhaar Document</Label>
                        <div className="relative aspect-3/2 border rounded-lg overflow-hidden">
                          <Image
                            src={selectedWorker.aadhaar_photo_url}
                            alt="Aadhaar Document"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {selectedWorker.pan_photo_url && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">PAN Document</Label>
                        <div className="relative aspect-3/2 border rounded-lg overflow-hidden">
                          <Image
                            src={selectedWorker.pan_photo_url}
                            alt="PAN Document"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ExitWorkerDialog
        worker={exitTarget}
        onCancel={() => setExitTarget(null)}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}
