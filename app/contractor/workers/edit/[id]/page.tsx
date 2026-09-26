"use client"

import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { Upload, X, Image as ImageIcon, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { updateWorker, API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"
import { shrinkImage, formatBytes, MAX_UPLOAD_BYTES, MAX_SENT_BYTES } from "@/lib/image"
import { parseMedical, MEDICAL_NOT_DONE } from "@/lib/medical"
import { optionsWithCurrent } from "@/lib/options"
import {
  changedFields,
  MAX_LENGTH,
  storedFormValues,
  workerToFormValues,
  type EditWorkerFormValues,
} from "@/lib/worker-form"
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
  FormDescription,
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
  mdclDone: false,
  mdclDate: "",
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
  // Set when the worker could not be loaded. The form is then not shown: saving the
  // empty form would have written blanks over the worker's name, phone and designation.
  const [loadError, setLoadError] = useState<string | null>(null)
  // What is saved for this worker; a save sends only the fields that differ from it.
  const [storedValues, setStoredValues] = useState<EditWorkerFormValues | null>(null)

  const form = useForm<EditWorkerFormValues>({
    defaultValues,
  })
  const selectedFloor = form.watch("floor")
  const selectedWorkLocation = form.watch("workLocation")
  const selectedDesignation = form.watch("designation")
  const selectedDepartment = form.watch("department")
  const currentlyStayingType = form.watch("currentlyStayingType")
  const medicalDone = form.watch("mdclDone")
  // Free text a worker already had in mdcl (e.g. "AUG-2026"), shown so it is not
  // silently replaced without the contractor seeing it.
  const [legacyMedical, setLegacyMedical] = useState("")
  // Photos already stored for this worker. Kept apart from the previews so the form
  // can say whether a picture is the saved one or a newly chosen replacement.
  const [savedPhotos, setSavedPhotos] = useState<{ passport: string | null; aadhaar: string | null; pan: string | null }>({
    passport: null,
    aadhaar: null,
    pan: null,
  })
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
        form.reset(workerToFormValues(data))
        setStoredValues(storedFormValues(data))
        setLegacyMedical(parseMedical(data.mdcl).legacy)

        // Show the photos already on file instead of empty upload boxes.
        setSavedPhotos({
          passport: data.passport_photo_url || null,
          aadhaar: data.aadhaar_photo_url || null,
          pan: data.pan_photo_url || null,
        })
        setPassportPhotoPreview(data.passport_photo_url || null)
        setAadharCardPreview(data.aadhaar_photo_url || null)
        setPanCardPreview(data.pan_photo_url || null)

        setIsLoading(false)
        toast.success("Worker Data Loaded", {
          description: "You can now edit the worker details."
        })
      } catch (error: any) {
        console.error("Failed to fetch worker:", error)
        toast.error("Failed to Load Worker", {
          description: error.message || "Could not fetch worker details."
        })
        setLoadError(error.message || "Could not fetch worker details.")
        setIsLoading(false)
      }
    }

    if (workerId) {
      fetchWorkerData()
    }
  }, [workerId, form])

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "passportPhoto" | "aadharCard" | "panCard",
    setPreview: (url: string | null) => void
  ) => {
    const original = e.target.files?.[0]
    if (original) {
      // Validate image format
      const validFormats = ["image/jpeg", "image/jpg", "image/png"]
      if (!validFormats.includes(original.type)) {
        toast.error("Invalid File Format", {
          description: "Please upload only JPG, JPEG, or PNG image formats."
        })
        e.target.value = ""
        return
      }

      if (original.size > MAX_UPLOAD_BYTES) {
        toast.error("File Too Large", {
          description: `Photos may be up to ${formatBytes(MAX_UPLOAD_BYTES)}. This one is ${formatBytes(original.size)}.`
        })
        e.target.value = ""
        return
      }

      // Phone photos are far bigger than an ID document needs, and three of them
      // together are rejected by the API gateway, so shrink before uploading.
      const file = await shrinkImage(original)

      if (file.size > MAX_SENT_BYTES) {
        toast.error("Could Not Compress Image", {
          description: "This image could not be made small enough to upload. Please use a smaller photo."
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
        description: file.size < original.size
          ? `${original.name} added (compressed ${formatBytes(original.size)} to ${formatBytes(file.size)}).`
          : `${original.name} has been uploaded successfully.`
      })
    }
  }

  const handleRemoveFile = (
    fieldName: "passportPhoto" | "aadharCard" | "panCard",
    setPreview: (url: string | null) => void
  ) => {
    form.setValue(fieldName, null)
    // Undoing a replacement brings the stored photo back into view; the saved photo
    // itself is only replaced when the form is submitted with a new file.
    const saved = fieldName === "passportPhoto" ? savedPhotos.passport
      : fieldName === "aadharCard" ? savedPhotos.aadhaar
      : savedPhotos.pan
    setPreview(saved)
  }

  async function onSubmit(values: EditWorkerFormValues) {
    if (values.mdclDone && !values.mdclDate) {
      toast.error("Medical Date Required", {
        description: "Enter the medical date, or untick Medical done."
      })
      return
    }

    if (!user) {
      toast.error("Authentication Error", {
        description: "You must be logged in to edit workers."
      })
      return
    }

    // The form is only rendered once the worker has loaded
    if (!storedValues) return
    const changes = changedFields(values, storedValues)
    if (Object.keys(changes).length === 0 && !values.passportPhoto && !values.aadharCard && !values.panCard) {
      toast.info("No Changes to Save", {
        description: "Nothing was changed for this worker."
      })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Updating worker...", {
      description: "Saving changes and updating documents..."
    })

    try {
      const response = await updateWorker(Number(workerId), {
        ...changes,

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

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="font-medium text-stone-900">Could not load this worker</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" asChild>
                <Link href="/contractor/workers">Back to List</Link>
              </Button>
            </div>
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
                            {optionsWithCurrent(titleOptions, form.watch("title")).map((option) => (
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
                        <Input maxLength={MAX_LENGTH.workerName} placeholder="Enter full name" {...field} />
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
                            {optionsWithCurrent(genderOptions, form.watch("gender")).map((option) => (
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
                            {optionsWithCurrent(designationOptions, selectedDesignation).map((option) => (
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
                          <Input maxLength={MAX_LENGTH.designationOther}
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
                            {optionsWithCurrent(departmentOptions, selectedDepartment).map((option) => (
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
                          <Input maxLength={MAX_LENGTH.departmentOther} placeholder="Enter department name" {...field} />
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
                            {optionsWithCurrent(locationOptions, selectedWorkLocation).map((option) => (
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
                          <Input maxLength={MAX_LENGTH.workLocationOther} placeholder="Enter work location" {...field} />
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
                            {optionsWithCurrent(floorOptions, selectedFloor).map((option) => (
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
                          <Input maxLength={MAX_LENGTH.floorOther} placeholder="Enter floor name" {...field} />
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
                        <Input maxLength={MAX_LENGTH.contactNumber} placeholder="Enter primary contact number" type="tel" {...field} />
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
                        <Input maxLength={MAX_LENGTH.email} placeholder="Enter email address" type="email" {...field} />
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
                        <Input maxLength={MAX_LENGTH.emergencyContactNumber} placeholder="Enter emergency contact number" type="tel" {...field} />
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
                        <Input maxLength={MAX_LENGTH.emrcyPNm} placeholder="Enter emergency person name" {...field} />
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
                        <Input maxLength={MAX_LENGTH.resp} placeholder="e.g., Father, Spouse, Brother" {...field} />
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
                        <Input maxLength={MAX_LENGTH.emrcyConNo} placeholder="Enter additional contact" type="tel" {...field} />
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
                        <Input maxLength={MAX_LENGTH.uanNumber} placeholder="Enter UAN number" {...field} />
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
                        <Input maxLength={MAX_LENGTH.esiNumber} placeholder="Enter ESI number" {...field} />
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
                        <Input maxLength={MAX_LENGTH.pinCode} placeholder="Enter PIN code" {...field} />
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
                        <Input maxLength={MAX_LENGTH.bankName} placeholder="Enter bank name" {...field} />
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
                        <Input maxLength={MAX_LENGTH.bankAc} placeholder="Enter account number" {...field} />
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
                        <Input maxLength={MAX_LENGTH.ifscCode} placeholder="Enter IFSC code" {...field} />
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
                        <Input maxLength={MAX_LENGTH.aprnSize} placeholder="e.g., S, M, L, XL" {...field} />
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
                        <Input maxLength={MAX_LENGTH.apronLockerNo} placeholder="e.g., 101" {...field} />
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
                        <Input maxLength={MAX_LENGTH.ftwrSize} placeholder="e.g., 7, 8, 9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mdclDone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Medical Status</FormLabel>
                      <FormControl>
                        <label className="flex h-9 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-stone-900"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked)
                              if (!e.target.checked) form.setValue("mdclDate", "")
                            }}
                          />
                          <span>Medical done</span>
                        </label>
                      </FormControl>
                      <FormDescription>
                        {legacyMedical
                          ? `Currently saved as "${legacyMedical}". Tick Medical done and enter the date to replace it.`
                          : medicalDone
                            ? "Enter the medical date."
                            : `Saved as "${MEDICAL_NOT_DONE}".`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {medicalDone && (
                  <FormField
                    control={form.control}
                    name="mdclDate"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Medical Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="remark"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input maxLength={MAX_LENGTH.remark} placeholder="Enter any remarks" {...field} />
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
                <p className="text-sm text-stone-500 mb-4">Photos already on file are shown below. Upload only to replace one (JPG, JPEG, PNG only, max 10MB each)</p>
                
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
                            <div className="space-y-2">
                              <div className="relative inline-block">
                                <img
                                  src={passportPhotoPreview}
                                  alt="Passport preview"
                                  className="h-32 w-32 rounded-lg border object-cover"
                                />
                                {passportPhotoPreview !== savedPhotos.passport && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -right-2 -top-2 h-6 w-6"
                                    title="Undo replacement"
                                    onClick={() => handleRemoveFile("passportPhoto", setPassportPhotoPreview)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-stone-500">
                                  {passportPhotoPreview === savedPhotos.passport ? "Photo on file" : "New photo - saved when you update"}
                                </span>
                                <label className="cursor-pointer text-xs font-medium text-orange-600 underline">
                                  Replace photo
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => handleFileChange(e, "passportPhoto", setPassportPhotoPreview)}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload passport photo
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 10MB)
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
                            <div className="space-y-2">
                              <div className="relative inline-block">
                                <img
                                  src={aadharCardPreview}
                                  alt="Aadhaar preview"
                                  className="h-32 w-48 rounded-lg border object-cover"
                                />
                                {aadharCardPreview !== savedPhotos.aadhaar && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -right-2 -top-2 h-6 w-6"
                                    title="Undo replacement"
                                    onClick={() => handleRemoveFile("aadharCard", setAadharCardPreview)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-stone-500">
                                  {aadharCardPreview === savedPhotos.aadhaar ? "Photo on file" : "New photo - saved when you update"}
                                </span>
                                <label className="cursor-pointer text-xs font-medium text-orange-600 underline">
                                  Replace photo
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => handleFileChange(e, "aadharCard", setAadharCardPreview)}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload Aadhaar card
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 10MB)
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
                            <div className="space-y-2">
                              <div className="relative inline-block">
                                <img
                                  src={panCardPreview}
                                  alt="PAN preview"
                                  className="h-32 w-48 rounded-lg border object-cover"
                                />
                                {panCardPreview !== savedPhotos.pan && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -right-2 -top-2 h-6 w-6"
                                    title="Undo replacement"
                                    onClick={() => handleRemoveFile("panCard", setPanCardPreview)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-stone-500">
                                  {panCardPreview === savedPhotos.pan ? "Photo on file" : "New photo - saved when you update"}
                                </span>
                                <label className="cursor-pointer text-xs font-medium text-orange-600 underline">
                                  Replace photo
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => handleFileChange(e, "panCard", setPanCardPreview)}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  Click to upload PAN card
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPG, PNG (MAX. 10MB)
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
