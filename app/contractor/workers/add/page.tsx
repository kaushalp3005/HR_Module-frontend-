"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { addWorker, getNextEmpId } from "@/lib/api"
import { toast } from "sonner"

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

// Validation schema
const workerFormSchema = z.object({
  empNo: z.string().min(1, "Employee number is required"),
  title: z.string().min(1, "Title is required"),
  workerName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  gender: z.string().min(1, "Gender is required"),
  dateOfJoining: z.string().min(1, "Joining date is required"),
  designation: z.string().min(1, "Designation is required"),
  designationOther: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  departmentOther: z.string().optional(),
  workLocation: z.string().min(1, "Work location is required"),
  workLocationOther: z.string().optional(),
  floor: z.string().min(1, "Floor is required"),
  floorOther: z.string().optional(),
  contactNumber: z.string()
    .min(10, "Contact number must be 10 digits")
    .max(10, "Contact number must be 10 digits")
    .regex(/^[0-9]+$/, "Contact number must contain only digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  emergencyContactNumber: z.string()
    .min(10, "Emergency contact must be 10 digits")
    .max(10, "Emergency contact must be 10 digits")
    .regex(/^[0-9]+$/, "Emergency contact must contain only digits"),
  emrcyPNm: z.string().optional(),
  resp: z.string().optional(),
  emrcyConNo: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  uanNumber: z.string().min(1, "UAN number is required"),
  esiNumber: z.string().min(1, "ESI number is required"),
  aadharNumber: z.string()
    .min(12, "Aadhaar must be 12 digits")
    .max(12, "Aadhaar must be 12 digits")
    .regex(/^[0-9]+$/, "Aadhaar must contain only digits"),
  panNumber: z.string()
    .refine(val => val === "" || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format (e.g., ABCDE1234F)")
    .optional(),
  currentlyStayingType: z.enum(["permanent", "rental"]).refine(val => val, {
    message: "Please select staying type"
  }),
  permanentAddress: z.string().optional(),
  rentalAddress: z.string().optional(),
  pinCode: z.string().optional(),
  bankName: z.string().optional(),
  bankAc: z.string().optional(),
  ifscCode: z.string().optional(),
  aprnSize: z.string().optional(),
  apronLockerNo: z.string().optional(),
  ftwrSize: z.string().optional(),
  mdcl: z.string().optional(),
  remark: z.string().optional(),
  passportPhoto: z.any().refine(val => val !== null, "Passport photo is required"),
  aadharCard: z.any().refine(val => val !== null, "Aadhaar card photo is required"),
  panCard: z.any().optional(),
})

type AddWorkerFormValues = z.infer<typeof workerFormSchema>

const defaultValues: Partial<AddWorkerFormValues> = {
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
  dateOfBirth: "",
  uanNumber: "",
  esiNumber: "",
  aadharNumber: "",
  panNumber: "",
  currentlyStayingType: undefined,
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
  emrcyPNm: "",
  resp: "",
  emrcyConNo: "",
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

export default function AddWorkerPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextEmpId, setNextEmpId] = useState<string>("")
  
  const form = useForm<AddWorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues,
    mode: "onChange",
  })
  const selectedFloor = form.watch("floor")
  const selectedWorkLocation = form.watch("workLocation")
  const selectedDesignation = form.watch("designation")
  const selectedDepartment = form.watch("department")
  const currentlyStayingType = form.watch("currentlyStayingType")
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null)
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null)
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null)

  // Fetch next employee number on component mount
  useEffect(() => {
    const fetchNextEmpId = async () => {
      if (user?.contractorId) {
        try {
          const empNo = await getNextEmpId(user.contractorId)
          setNextEmpId(empNo)
          form.setValue("empNo", empNo)
        } catch (error) {
          console.error("Failed to fetch next emp id:", error)
          toast.error("Failed to generate employee number")
        }
      }
    }
    
    fetchNextEmpId()
  }, [user?.contractorId, form])

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

  async function onSubmit(values: AddWorkerFormValues) {
    // // Validate required fields
    // if (!values.workerName || !values.workerName.trim()) {
    //   toast.error("Missing Required Field", {
    //     description: "Worker name is required."
    //   })
    //   return
    // }
    
    // if (!values.contactNumber || !values.contactNumber.trim()) {
    //   toast.error("Missing Required Field", {
    //     description: "Contact number is required."
    //   })
    //   return
    // }
    
    // if (!values.designation || !values.designation.trim()) {
    //   toast.error("Missing Required Field", {
    //     description: "Designation is required."
    //   })
    //   return
    // }
    
    // if (!values.aadharNumber || !values.aadharNumber.trim()) {
    //   toast.error("Missing Required Field", {
    //     description: "Aadhaar number is required."
    //   })
    //   return
    // }
    
    // // Validate Aadhaar format (12 digits)
    // if (!/^\d{12}$/.test(values.aadharNumber.replace(/\s/g, ''))) {
    //   toast.error("Invalid Aadhaar Number", {
    //     description: "Aadhaar number must be 12 digits."
    //   })
    //   return
    // }
    
    // // Validate PAN format if provided (ABCDE1234F)
    // if (values.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(values.panNumber.toUpperCase())) {
    //   toast.error("Invalid PAN Number", {
    //     description: "PAN format should be: ABCDE1234F"
    //   })
    //   return
    // }
    
    // // Validate phone number (10 digits)
    // if (!/^\d{10}$/.test(values.contactNumber.replace(/\s/g, ''))) {
    //   toast.error("Invalid Contact Number", {
    //     description: "Contact number must be 10 digits."
    //   })
    //   return
    // }
    
    // Validate required files
    if (!values.passportPhoto || !values.aadharCard) {
      toast.error("Missing Required Documents", {
        description: "Please upload Passport photo and Aadhaar card to continue."
      })
      return
    }

    if (!user) {
      toast.error("Authentication Error", {
        description: "You must be logged in to add workers."
      })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Adding worker...", {
      description: "Uploading documents and encrypting sensitive data..."
    })

    try {
      const workerPayload = {
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
        
        // Contractor Information
        contractor_id: user.contractorId || "unknown",
        contractor_name: user.name || "Unknown Contractor",
        
        // Document Uploads
        passport_photo: values.passportPhoto,
        aadhaar_photo: values.aadharCard,
        pan_photo: values.panCard || undefined,
      };

      console.log("📋 Submitting worker data:", {
        ...workerPayload,
        passport_photo: workerPayload.passport_photo ? `File: ${workerPayload.passport_photo.name} (${workerPayload.passport_photo.size} bytes)` : null,
        aadhaar_photo: workerPayload.aadhaar_photo ? `File: ${workerPayload.aadhaar_photo.name} (${workerPayload.aadhaar_photo.size} bytes)` : null,
        pan_photo: workerPayload.pan_photo ? `File: ${workerPayload.pan_photo.name} (${workerPayload.pan_photo.size} bytes)` : null,
      });

      const response = await addWorker(workerPayload)

      toast.success("Worker Added Successfully!", {
        description: `Worker ID: ${response.worker_id}. Data encrypted and stored securely.`,
        id: toastId
      })
      
      // Reset form
      form.reset()
      setPassportPhotoPreview(null)
      setAadharCardPreview(null)
      setPanCardPreview(null)
      
      // Redirect to workers list
      setTimeout(() => {
        router.push("/contractor/workers")
      }, 1500)
      
    } catch (error: any) {
      console.error("Failed to add worker:", error)
      toast.error("Failed to Add Worker", {
        description: error.message || "An unexpected error occurred. Please try again.",
        id: toastId
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 bg-linear-to-r from-orange-50 to-amber-50 border-b">
          <CardTitle className="text-3xl font-bold text-stone-900">
            Add New Worker
          </CardTitle>
          <CardDescription className="text-stone-600">
            Complete all required fields to add a new worker to your team. All fields except email are mandatory.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
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
                      <FormLabel className="text-sm font-medium">Employee Number (Auto-Generated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Loading..." 
                          {...field} 
                          readOnly 
                          className="bg-muted/50 cursor-not-allowed border-stone-200"
                          value={nextEmpId || field.value}
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
                <p className="text-sm text-stone-500 mb-4">Upload required documents (JPG, JPEG, PNG only, max 5MB each)</p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Passport Photo Upload */}
                <FormField
                  control={form.control}
                  name="passportPhoto"
                  render={() => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Passport Size Photo *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {!passportPhotoPreview ? (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-stone-400 mb-3" />
                                <p className="text-sm text-stone-600 font-medium">Click to upload</p>
                                <p className="text-xs text-stone-400 mt-1">JPG, JPEG, PNG (MAX. 5MB)</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) => handleFileChange(e, "passportPhoto", setPassportPhotoPreview)}
                              />
                            </label>
                          ) : (
                            <div className="relative w-full h-40 border-2 border-stone-300 rounded-lg overflow-hidden">
                              <img
                                src={passportPhotoPreview}
                                alt="Passport photo preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFile("passportPhoto", setPassportPhotoPreview)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aadhar Card Upload */}
                <FormField
                  control={form.control}
                  name="aadharCard"
                  render={() => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Aadhar Card *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {!aadharCardPreview ? (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-stone-400 mb-3" />
                                <p className="text-sm text-stone-600 font-medium">Click to upload</p>
                                <p className="text-xs text-stone-400 mt-1">JPG, JPEG, PNG (MAX. 5MB)</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) => handleFileChange(e, "aadharCard", setAadharCardPreview)}
                              />
                            </label>
                          ) : (
                            <div className="relative w-full h-40 border-2 border-stone-300 rounded-lg overflow-hidden">
                              <img
                                src={aadharCardPreview}
                                alt="Aadhar card preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFile("aadharCard", setAadharCardPreview)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PAN Card Upload */}
                <FormField
                  control={form.control}
                  name="panCard"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>PAN Card</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {!panCardPreview ? (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-stone-400 mb-3" />
                                <p className="text-sm text-stone-600 font-medium">Click to upload</p>
                                <p className="text-xs text-stone-400 mt-1">JPG, JPEG, PNG (MAX. 5MB)</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) => handleFileChange(e, "panCard", setPanCardPreview)}
                              />
                            </label>
                          ) : (
                            <div className="relative w-full max-w-md h-40 border-2 border-stone-300 rounded-lg overflow-hidden">
                              <img
                                src={panCardPreview}
                                alt="PAN card preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFile("panCard", setPanCardPreview)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button type="reset" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
                  Reset
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                  {isSubmitting ? "Saving..." : "Save Worker"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
