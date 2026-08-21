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
  emergencyContactNumber: string
  dateOfBirth: string
  uanNumber: string
  esiNumber: string
  aadharNumber: string
  panNumber: string
  address: string
  currentlyStayingType: "permanent" | "rental" | ""
  permanentAddress: string
  rentalAddress: string
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
  emergencyContactNumber: "",
  dateOfBirth: "",
  uanNumber: "",
  esiNumber: "",
  aadharNumber: "",
  panNumber: "",
  address: "",
  currentlyStayingType: "",
  permanentAddress: "",
  rentalAddress: "",
  passportPhoto: null,
  aadharCard: null,
  panCard: null,
}

const titleOptions = ["MR", "MRS", "MS", "DR"]
const genderOptions = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]
const designationOptions = ["LINE WORKER", "SUPERVISOR", "TEAM LEADER", "MACHINE OPERATOR", "TECHNICIAN", "PRINTING", "OTHER"]
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
        email: values.contactNumber + "@temp.com",
        emergency_contact_number: values.emergencyContactNumber || undefined,
        
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
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="empNo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Employee Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter employee number" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {titleOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workerName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Worker Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter worker name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfJoining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Joining</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {designationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDesignation === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="designationOther"
                    render={({ field }) => (
                      <FormItem>
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
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDepartment === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="departmentOther"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Please specify department</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter department name"
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
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedWorkLocation === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="workLocationOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter work location"
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
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {floorOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedFloor === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="floorOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify floor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter floor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 10 digit number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter emergency contact"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UAN Number</FormLabel>
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
                    <FormItem>
                      <FormLabel>ESI Number</FormLabel>
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
                    <FormItem>
                      <FormLabel>Aadhaar Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 12 digit Aadhaar"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter PAN (e.g., ABCDE1234F)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentlyStayingType"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Currently Staying Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staying type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="rental">Rental</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentlyStayingType === "permanent" && (
                  <FormField
                    control={form.control}
                    name="permanentAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Permanent Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter permanent address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentlyStayingType === "rental" && (
                  <FormField
                    control={form.control}
                    name="rentalAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rental Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter rental address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Documents (Optional - Upload only to replace existing)</h3>
                
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
