"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Eye, User, Phone, Mail, Calendar, MapPin, Building, IdCard, FileText } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type Worker = {
  id: number
  emp_id?: string
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
  contractor_name: string
  status: string
  aadhaar?: string
  pan?: string
  passport_photo_url?: string
  aadhaar_photo_url?: string
  pan_photo_url?: string
  created_at: string
}

const WAREHOUSES = [
  { key: "all", label: "All" },
  { key: "W-202", label: "W-202" },
  { key: "A-185", label: "A-185" },
  { key: "A-68", label: "A-68" },
  { key: "HOH-101", label: "HOH-101" },
]

export default function ApprovalsPage() {
  const [pendingWorkers, setPendingWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingApproval, setProcessingApproval] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const { user } = useAppStore()

  // Fetch pending workers
  useEffect(() => {
    fetchPendingWorkers()
  }, [])

  const fetchPendingWorkers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers?status=pending`)
      if (!response.ok) {
        throw new Error("Failed to fetch pending workers")
      }
      const data = await response.json()
      setPendingWorkers(data)
    } catch (error: any) {
      console.error("Error fetching pending workers:", error)
      toast.error("Failed to Load Pending Workers", {
        description: error.message || "Could not fetch pending workers."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (worker: Worker) => {
    setProcessingApproval(true)
    const toastId = toast.loading("Approving worker...")
    
    try {
      const response = await fetch(`${API_BASE_URL}/workers/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_id: worker.id,
          approved: true,
          approved_by: user?.email || "HR Admin"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to approve worker")
      }

      toast.success("Worker Approved Successfully!", {
        description: `${worker.name} can now access the system.`,
        id: toastId
      })

      // Refresh the list and close details view
      setSelectedWorker(null)
      fetchPendingWorkers()
    } catch (error: any) {
      console.error("Error approving worker:", error)
      toast.error("Failed to Approve Worker", {
        description: error.message || "Could not approve worker.",
        id: toastId
      })
    } finally {
      setProcessingApproval(false)
    }
  }

  const handleReject = async () => {
    if (!selectedWorker || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    setProcessingApproval(true)
    const toastId = toast.loading("Rejecting worker...")
    
    try {
      const response = await fetch(`${API_BASE_URL}/workers/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_id: selectedWorker.id,
          approved: false,
          approved_by: user?.email || "HR Admin",
          rejection_reason: rejectionReason.trim()
        })
      })

      if (!response.ok) {
        throw new Error("Failed to reject worker")
      }

      toast.success("Worker Rejected", {
        description: `${selectedWorker.name} has been rejected with reason provided.`,
        id: toastId
      })

      // Reset state and refresh list
      setIsRejectDialogOpen(false)
      setRejectionReason("")
      setSelectedWorker(null)
      fetchPendingWorkers()
    } catch (error: any) {
      console.error("Error rejecting worker:", error)
      toast.error("Failed to Reject Worker", {
        description: error.message || "Could not reject worker.",
        id: toastId
      })
    } finally {
      setProcessingApproval(false)
    }
  }

  // Helper function to render field only if it has value
  const renderField = (label: string, value: any, icon?: React.ReactNode) => {
    if (!value || value === "N/A" || value === "") return null
    
    return (
      <div>
        <Label className="text-muted-foreground">{label}</Label>
        <p className="font-medium flex items-center gap-1">
          {icon}
          {value}
        </p>
      </div>
    )
  }

  // Helper function to get filled personal info fields
  const getPersonalInfoFields = (worker: Worker) => {
    const fields = [
      { label: "Full Name", value: worker.name, icon: null },
      { label: "Title", value: worker.title, icon: null },
      { label: "Employee ID", value: worker.emp_id, icon: null },
      { label: "Gender", value: worker.gender, icon: null },
      { label: "Date of Birth", value: worker.date_of_birth, icon: <Calendar className="w-3 h-3" /> },
      { label: "Phone Number", value: worker.phone, icon: <Phone className="w-3 h-3" /> },
      { label: "Email Address", value: worker.email, icon: <Mail className="w-3 h-3" /> },
      { label: "Emergency Contact", value: worker.emergency_contact_number, icon: <Phone className="w-3 h-3" /> },
      { label: "Date of Joining", value: worker.date_of_joining, icon: <Calendar className="w-3 h-3" /> },
      { label: "Application Date", value: new Date(worker.created_at).toLocaleDateString(), icon: <Calendar className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  // Helper function to get filled work info fields
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

  // Helper function to get filled government ID fields
  const getGovernmentIdFields = (worker: Worker) => {
    const fields = [
      { label: "Aadhaar Number", value: worker.aadhaar, icon: <IdCard className="w-3 h-3" /> },
      { label: "PAN Number", value: worker.pan, icon: <IdCard className="w-3 h-3" /> },
      { label: "UAN Number", value: worker.uan_number, icon: <IdCard className="w-3 h-3" /> },
      { label: "ESI Number", value: worker.esi_number, icon: <IdCard className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  // Helper function to get filled address fields
  const getAddressFields = (worker: Worker) => {
    const fields = [
      { label: "Current Address", value: worker.address, icon: <MapPin className="w-3 h-3" /> },
      { label: "Staying Type", value: worker.currently_staying_type, icon: null },
      { label: "Permanent Address", value: worker.permanent_address, icon: <MapPin className="w-3 h-3" /> },
      { label: "Rental Address", value: worker.rental_address, icon: <MapPin className="w-3 h-3" /> },
    ]
    return fields.filter(field => field.value && field.value !== "")
  }

  const filteredPendingWorkers = selectedWarehouse === "all"
    ? pendingWorkers
    : pendingWorkers.filter(w => w.work_location?.toUpperCase().includes(selectedWarehouse.toUpperCase()))

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Approvals Queue"
        subtitle={`${filteredPendingWorkers.length} workers pending approval`}
      />

      {/* Warehouse Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {WAREHOUSES.map((wh) => {
          const count = wh.key === "all"
            ? pendingWorkers.length
            : pendingWorkers.filter(w => w.work_location?.toUpperCase().includes(wh.key.toUpperCase())).length
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

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {loading ? (
          <Card>
            <CardContent className="pt-6 sm:pt-8 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">Loading pending workers...</p>
            </CardContent>
          </Card>
        ) : filteredPendingWorkers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 sm:pt-8 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">No pending approvals</p>
            </CardContent>
          </Card>
        ) : (
          filteredPendingWorkers.map((worker) => (
            <Card key={worker.id} className="container-responsive">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl truncate">{worker.name}</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {worker.designation} • {worker.contractor_name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs sm:text-sm">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Employee ID</p>
                    <p className="font-medium text-sm sm:text-base">{worker.emp_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Phone</p>
                    <p className="font-medium text-sm sm:text-base">{worker.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Department</p>
                    <p className="font-medium text-sm sm:text-base">{worker.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Work Location</p>
                    <p className="font-medium text-sm sm:text-base">{worker.work_location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Joining Date</p>
                    <p className="font-medium text-sm sm:text-base">{worker.date_of_joining || "N/A"}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="gap-2 flex-1 text-xs sm:text-sm"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Full Worker Details Dialog */}
      {selectedWorker && (
        <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Worker Approval - {selectedWorker.name}
              </DialogTitle>
              <DialogDescription>
                Review all worker details and documents before making approval decision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Approval Actions - Top */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted rounded-lg">
                <Button
                  className="gap-2 flex-1"
                  onClick={() => handleApprove(selectedWorker)}
                  disabled={processingApproval}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Worker
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2 flex-1"
                  onClick={() => setIsRejectDialogOpen(true)}
                  disabled={processingApproval}
                >
                  <XCircle className="w-4 h-4" />
                  Reject Worker
                </Button>
              </div>

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

              {/* Action Buttons - Bottom */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted rounded-lg">
                <Button
                  className="gap-2 flex-1"
                  onClick={() => handleApprove(selectedWorker)}
                  disabled={processingApproval}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Worker
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2 flex-1"
                  onClick={() => setIsRejectDialogOpen(true)}
                  disabled={processingApproval}
                >
                  <XCircle className="w-4 h-4" />
                  Reject Worker
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Worker Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedWorker?.name}'s application. This will be recorded and can be viewed later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a detailed reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false)
                setRejectionReason("")
              }}
              disabled={processingApproval}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingApproval}
            >
              {processingApproval ? "Rejecting..." : "Reject Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
