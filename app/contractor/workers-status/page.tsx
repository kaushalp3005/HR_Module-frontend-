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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Eye, Edit2, Trash2, Plus, Upload, User, Phone, Mail, Calendar, MapPin, Building, IdCard, FileText } from "lucide-react"
import Image from "next/image"

interface Worker {
  id: string  // Changed to string to match ResponsiveTable requirements
  emp_no?: string
  title?: string
  name: string
  gender?: string
  date_of_birth?: string
  phone: string
  email?: string
  emergency_contact_number?: string
  designation: string
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
  approved_by?: string
}

export default function WorkersStatusPage() {
  const user = useAppStore((state) => state.user)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("approved")
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      try {
        await deleteWorkerAPI(Number(id))
        toast.success("Worker deleted successfully")
        // Refresh the list
        fetchWorkers()
      } catch (error) {
        console.error("Failed to delete worker:", error)
        toast.error("Failed to delete worker")
      }
    }
  }

  // Columns for approved workers (full details)
  const approvedColumns = [
    {
      key: "emp_no" as const,
      label: "Emp No",
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
        <Badge variant="default" className="text-xs sm:text-sm bg-green-600 hover:bg-green-700">
          {value}
        </Badge>
      ),
    },
  ]

  // Columns for rejected workers (only specific fields)
  const rejectedColumns = [
    {
      key: "emp_no" as const,
      label: "Emp No",
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
      key: "status" as const,
      label: "Status",
      render: (value: string) => (
        <Badge variant="destructive" className="text-xs sm:text-sm">
          {value}
        </Badge>
      ),
    },
    {
      key: "rejection_reason" as const,
      label: "Rejection Reason",
      render: (value: string) => (
        <div className="max-w-xs">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {value || "No reason provided"}
          </span>
        </div>
      ),
    },
  ]

  // Filter workers based on active tab (only approved and rejected)
  const filteredWorkers = workers.filter(worker => {
    if (activeTab === "approved") return worker.status === "approved"
    if (activeTab === "rejected") return worker.status === "rejected"
    return false
  })

  // Count workers by status
  const counts = {
    all: workers.length,
    pending: workers.filter(w => w.status === "pending").length,
    approved: workers.filter(w => w.status === "approved").length,
    rejected: workers.filter(w => w.status === "rejected").length,
  }

  // Helper functions for dynamic field rendering (same as HR approval page)
  const getPersonalInfoFields = (worker: Worker) => {
    const fields = [
      { label: "Full Name", value: worker.name, icon: null },
      { label: "Title", value: worker.title, icon: null },
      { label: "Employee Number", value: worker.emp_no, icon: null },
      { label: "Gender", value: worker.gender, icon: null },
      { label: "Date of Birth", value: worker.date_of_birth, icon: <Calendar className="w-3 h-3" /> },
      { label: "Phone Number", value: worker.phone, icon: <Phone className="w-3 h-3" /> },
      { label: "Email Address", value: worker.email, icon: <Mail className="w-3 h-3" /> },
      { label: "Emergency Contact", value: worker.emergency_contact_number, icon: <Phone className="w-3 h-3" /> },
      { label: "Date of Joining", value: worker.date_of_joining, icon: <Calendar className="w-3 h-3" /> },
      { label: "Application Date", value: worker.created_at ? new Date(worker.created_at).toLocaleDateString() : null, icon: <Calendar className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const getWorkInfoFields = (worker: Worker) => {
    const fields = [
      { label: "Designation", value: worker.designation, icon: null },
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
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Workers Status"
        subtitle="View approved and rejected workers"
        actions={
          <Button asChild className="gap-2 text-xs sm:text-sm" variant="outline">
            <Link href="/contractor/workers">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">View All Workers</span>
              <span className="sm:hidden">All</span>
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
           All Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>

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
                actions={(row: Worker) => (
                  <div className="flex gap-2">
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
                  variant={selectedWorker.status === "approved" ? "default" : "destructive"}
                  className="ml-2"
                >
                  {selectedWorker.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedWorker.status === "rejected" 
                  ? "This worker application was rejected by HR. View details and rejection reason below."
                  : "Complete worker information and current status."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
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
    </div>
  )
}
