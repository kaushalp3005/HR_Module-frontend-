"use client"

import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { Upload, X, Image as ImageIcon, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { updateWorker, API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EditWorkerFormValues = {
  empNo: string
  title: string
  workerName: string
  gender: string
  dateOfJoining: string
  designation: string
  designationOther: string
  department: string
  departmentOther: string
  workLocation: string
  workLocationOther: string
  floor: string
  floorOther: string
  contactNumber: string
  email: string
  emergencyContactNumber: string
  emrcyPNm: string
  resp: string
  emrcyConNo: string
  dateOfBirth: string
  uanNumber: string
  esiNumber: string
  aadharNumber: string
  panNumber: string
  address: string
  currentlyStayingType: "permanent" | "rental" | ""
  permanentAddress: string
  rentalAddress: string
  pinCode: string
  bankName: string
  bankAc: string
  ifscCode: string
  aprnSize: string
  apronLockerNo: string
  ftwrSize: string
  mdcl: string
  remark: string
  passportPhoto: File | null
  aadharCard: File | null
  panCard: File | null
}

const defaultValues: EditWorkerFormValues = {
  empNo: "",
  title: "",
  workerName: "",
  gender: "",
  dateOfJoining: "",
  designation: "",
  designationOther: "",
  department: "",
  departmentOther: "",
  workLocation: "",
  workLocationOther: "",
  floor: "",
  floorOther: "",
  contactNumber: "",
  email: "",
  emergencyContactNumber: "",
  emrcyPNm: "",
  resp: "",
  emrcyConNo: "",
  dateOfBirth: "",
  uanNumber: "",
  esiNumber: "",
  aadharNumber: "",
  panNumber: "",
  address: "",
  currentlyStayingType: "",
  permanentAddress: "",
  rentalAddress: "",
  pinCode: "",
  bankName: "",
  bankAc: "",
  ifscCode: "",
  aprnSize: "",
  apronLockerNo: "",
  ftwrSize: "",
  mdcl: "",
  remark: "",
  passportPhoto: null,
  aadharCard: null,
  panCard: null,
}

const titleOptions = ["MR", "MRS", "MS", "DR"]
const genderOptions = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]
const designationOptions = ["LINE WORKER", "SUPERVISOR", "TEAM LEADER", "MACHINE OPERATOR", "TECHNICIAN", "PRINTING", "HOUSEKEEPING", "OTHER"]
const departmentOptions = ["Production", "Seasoning", "Service Floor", "Printing", "CHOCOLATE", "OTHER"]
const locationOptions = ["A-68-Mahape", "A-101-Koparkhairne", "W-202-Koparkhairne", "A-185-Koparkhairne", "F-53-APMC", "OTHER"]
const floorOptions = [
  "GROUND FLOOR",
  "FIRST FLOOR",
  "SECOND FLOOR",
  "THIRD FLOOR",
  "FIFTH FLOOR",
  "UPPER FLOOR",
  "LOWER BASEMENT",
  "SERVICE FLOOR",
  "SEASONING",
  "PRINTING",
  "CHOCOLATE",
  "DMART",
  "MAJOR LINE",
  "PACKAGING",
  "OTHER",
]

export default function EditWorkerPage() {
  const router = useRouter()
  const params = useParams()
  const workerId = params.id as string
  const user = useAppStore((state) => state.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const form = useForm<EditWorkerFormValues>({
    defaultValues,
  })
  const selectedFloor = form.watch("floor")
  const selectedWorkLocation = form.watch("workLocation")
  const selectedDesignation = form.watch("designation")
  const selectedDepartment = form.watch("department")
  const currentlyStayingType = form.watch("currentlyStayingType")
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null)
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null)
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null)

  // Fetch worker data
  useEffect(() => {
    async function fetchWorkerData() {
      try {
        const response = await fetch(`${API_BASE_URL}/workers/${workerId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch worker data")
        }
        const data = await response.json()
        
        // Populate form with existing data
        form.setValue("empNo", data.emp_id || "")
        form.setValue("title", data.title || "")
        form.setValue("workerName", data.name || "")
        form.setValue("gender", data.gender || "")
        form.setValue("dateOfJoining", data.date_of_joining || "")
        form.setValue("designation", data.designation || "")
        form.setValue("designationOther", data.designation_other || "")
        form.setValue("department", data.department || "")
        form.setValue("departmentOther", data.department_other || "")
        form.setValue("workLocation", data.work_location || "")
        form.setValue("workLocationOther", data.work_location_other || "")
        form.setValue("floor", data.floor || "")
        form.setValue("floorOther", data.floor_other || "")
        form.setValue("contactNumber", data.phone || "")
        form.setValue("emergencyContactNumber", data.emergency_contact_number || "")
        form.setValue("dateOfBirth", data.date_of_birth || "")
        form.setValue("uanNumber", data.uan_number || "")
        form.setValue("esiNumber", data.esi_number || "")
        form.setValue("aadharNumber", data.aadhaar || "")
        form.setValue("panNumber", data.pan || "")
        form.setValue("address", data.address || "")
        form.setValue("currentlyStayingType", data.currently_staying_type || "")
        form.setValue("permanentAddress", data.permanent_address || "")
        form.setValue("rentalAddress", data.rental_address || "")
        form.setValue("email", data.email || "")
        form.setValue("emrcyPNm", data.emrcy_p_nm || "")
        form.setValue("resp", data.resp || "")
        form.setValue("emrcyConNo", data.emrcy_con_no || "")
        form.setValue("pinCode", data.pin_code || "")
        form.setValue("bankName", data.bank_name || "")
        form.setValue("bankAc", data.bank_ac || "")
        form.setValue("ifscCode", data.ifsc_code || "")
        form.setValue("aprnSize", data.aprn_size || "")
        form.setValue("apronLockerNo", data.apron_locker_no || "")
        form.setValue("ftwrSize", data.ftwr_size || "")
        form.setValue("mdcl", data.mdcl || "")
        form.setValue("remark", data.remark || "")
        
        setIsLoading(false)
        toast.success("Worker Data Loaded", {
          description: "You can now edit the worker details."
        })
      } catch (error: any) {
        console.error("Failed to fetch worker:", error)
        toast.error("Failed to Load Worker", {
          description: error.message || "Could not fetch worker details."
        })
        setIsLoading(false)
      }
    }

    if (workerId) {
      fetchWorkerData()
    }
  }, [workerId, form])

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "passportPhoto" | "aadharCard" | "panCard",
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate image format
      const validFormats = ["image/jpeg", "image/jpg", "image/png"]
      if (!validFormats.includes(file.type)) {
        toast.error("Invalid File Format", {
          description: "Please upload only JPG, JPEG, or PNG image formats."
        })
        e.target.value = ""
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "File size should not exceed 5MB. Please compress the image."
        })
        e.target.value = ""
        return
      }

      form.setValue(fieldName, file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      toast.success("File Uploaded", {
        description: `${file.name} has been uploaded successfully.`
      })
    }
  }

  const handleRemoveFile = (
    fieldName: "passportPhoto" | "aadharCard" | "panCard",
    setPreview: (url: string | null) => void
  ) => {
    form.setValue(fieldName, null)
    setPreview(null)
  }

  async function onSubmit(values: EditWorkerFormValues) {
    if (!user) {
      toast.error("Authentication Error", {
        description: "You must be logged in to edit workers."
      })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Updating worker...", {
      description: "Saving changes and updating documents..."
    })

    try {
      const response = await updateWorker(Number(workerId), {
        // Basic Information
        emp_id: values.empNo || undefined,
        title: values.title || undefined,
        name: values.workerName,
        gender: values.gender || undefined,
        date_of_birth: values.dateOfBirth || undefined,
        date_of_joining: values.dateOfJoining || undefined,
        
        // Contact Information
        phone: values.contactNumber,
        email: values.email || undefined,
        emergency_contact_number: values.emergencyContactNumber || undefined,
        emrcy_p_nm: values.emrcyPNm || undefined,
        resp: values.resp || undefined,
        emrcy_con_no: values.emrcyConNo || undefined,
        
        // Work Information
        designation: values.designation,
        designation_other: values.designationOther || undefined,
        department: values.department || undefined,
        department_other: values.departmentOther || undefined,
        work_location: values.workLocation || undefined,
        work_location_other: values.workLocationOther || undefined,
        floor: values.floor || undefined,
        floor_other: values.floorOther || undefined,
        
        // Government IDs
        aadhaar: values.aadharNumber,
        pan: values.panNumber || undefined,
        uan_number: values.uanNumber || undefined,
        esi_number: values.esiNumber || undefined,
        
        // Address Information
        address: values.address || undefined,
        currently_staying_type: values.currentlyStayingType || undefined,
        permanent_address: values.permanentAddress || undefined,
        rental_address: values.rentalAddress || undefined,
        pin_code: values.pinCode || undefined,

        // Banking Information
        bank_name: values.bankName || undefined,
        bank_ac: values.bankAc || undefined,
        ifsc_code: values.ifscCode || undefined,

        // Additional Information
        aprn_size: values.aprnSize || undefined,
        apron_locker_no: values.apronLockerNo || undefined,
        ftwr_size: values.ftwrSize || undefined,
        mdcl: values.mdcl || undefined,
        remark: values.remark || undefined,
        
        // Document Uploads (only if new files selected)
        passport_photo: values.passportPhoto || undefined,
        aadhaar_photo: values.aadharCard || undefined,
        pan_photo: values.panCard || undefined,
      })

      toast.success("Worker Updated Successfully!", {
        description: "All changes have been saved securely.",
        id: toastId
      })
      
      // Redirect to workers list
      setTimeout(() => {
        router.push("/contractor/workers")
      }, 1500)
      
    } catch (error: any) {
      console.error("Failed to update worker:", error)
      toast.error("Failed to Update Worker", {
        description: error.message || "An unexpected error occurred. Please try again.",
        id: toastId
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading worker data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/contractor/workers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Link>
            </Button>
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold text-stone-900">
              Edit Worker
            </CardTitle>
            <CardDescription className="text-sm text-stone-500">
              Update worker details. Documents are optional - only upload if you want to replace existing ones.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="empNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Employee Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Loading..."
                          {...field}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed border-stone-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                          <SelectContent>
                            {titleOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workerName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Name of the Worker</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option.replaceAll("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfJoining"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Date of Joining</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Work Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Designation <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDesignation === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="designationOther"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Please specify designation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter designation"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDepartment === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="departmentOther"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Specify Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter department name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Work Location <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locationOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedWorkLocation === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="workLocationOther"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Specify Work Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter work location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Floor <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            {floorOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedFloor === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="floorOther"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Specify Floor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter floor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Contact Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter primary contact number" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Emergency Contact Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency contact number" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emrcyPNm"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Emergency Person Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resp"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Relationship (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Father, Spouse, Brother" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emrcyConNo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Additional Emergency Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter additional contact" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Personal & Government IDs Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Personal & Government IDs</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uanNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>UAN Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter UAN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="esiNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>ESI Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ESI number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadharNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Aadhar Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Aadhar number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PAN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Address Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Currently Staying Type */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="currentlyStayingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currently Staying <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="permanent"
                                checked={field.value === "permanent"}
                                onChange={() => field.onChange("permanent")}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-stone-700">Permanent Address</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="rental"
                                checked={field.value === "rental"}
                                onChange={() => field.onChange("rental")}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-stone-700">Rental Address</span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Permanent Address */}
                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Permanent Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Enter permanent address"
                          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-[100px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rental Address - Only show if rental type is selected */}
                {currentlyStayingType === "rental" && (
                  <FormField
                    control={form.control}
                    name="rentalAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rental Address</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Enter rental address"
                            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-[100px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter address" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>PIN Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PIN code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Banking Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Banking Information (Optional)</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAc"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Bank Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Additional Information (Optional)</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="aprnSize"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Apron Size</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., S, M, L, XL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apronLockerNo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Apron Locker No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftwrSize"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Footwear Size</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 7, 8, 9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mdcl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Medical Status</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medical status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remark"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter any remarks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 border-b pb-2">Document Uploads</h3>
                <p className="text-sm text-stone-500 mb-4">Upload only to replace existing documents (JPG, JPEG, PNG only, max 5MB each)</p>
                
                {/* Passport Photo */}
                <FormField
                  control={form.control}
                  name="passportPhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Size Photo</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          {passportPhotoPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={passportPhotoPreview}
                                alt="Passport preview"
                                className="h-32 w-32 rounded-lg border object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-2 -top-2 h-6 w-6"
                                onClick={() =>
                                  handleRemoveFile(
                                    "passportPhoto",
                                    setPassportPhotoPreview
                                  )
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload passport photo
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    "passportPhoto",
                                    setPassportPhotoPreview
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aadhaar Card */}
                <FormField
                  control={form.control}
                  name="aadharCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Card</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          {aadharCardPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={aadharCardPreview}
                                alt="Aadhaar preview"
                                className="h-32 w-48 rounded-lg border object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-2 -top-2 h-6 w-6"
                                onClick={() =>
                                  handleRemoveFile(
                                    "aadharCard",
                                    setAadharCardPreview
                                  )
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload Aadhaar card
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    "aadharCard",
                                    setAadharCardPreview
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PAN Card */}
                <FormField
                  control={form.control}
                  name="panCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Card</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          {panCardPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={panCardPreview}
                                alt="PAN preview"
                                className="h-32 w-48 rounded-lg border object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-2 -top-2 h-6 w-6"
                                onClick={() =>
                                  handleRemoveFile("panCard", setPanCardPreview)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload PAN card
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) =>
                                  handleFileChange(e, "panCard", setPanCardPreview)
                                }
                              />
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Updating..." : "Update Worker"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/contractor/workers")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
