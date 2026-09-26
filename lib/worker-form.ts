// Load/save logic of the worker edit form, kept free of React so it can be tested
// against real records.

import type { AddWorkerPayload } from "@/lib/api"
import { formatMedical, parseMedical } from "@/lib/medical"
import type { WorkerRecord } from "@/lib/worker-fields"

export type EditWorkerFormValues = {
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
  mdclDone: boolean
  mdclDate: string
  remark: string
  passportPhoto: File | null
  aadharCard: File | null
  panCard: File | null
}

/**
 * Longest value each text input may hold - the varchar sizes of workers_data. A longer
 * value makes the database reject the whole save.
 */
export const MAX_LENGTH = {
  workerName: 255,
  designationOther: 255,
  departmentOther: 255,
  workLocationOther: 255,
  floorOther: 255,
  contactNumber: 20,
  email: 255,
  emergencyContactNumber: 20,
  emrcyPNm: 255,
  resp: 255,
  emrcyConNo: 20,
  uanNumber: 50,
  esiNumber: 50,
  pinCode: 10,
  bankName: 255,
  bankAc: 50,
  ifscCode: 20,
  aprnSize: 10,
  apronLockerNo: 20,
  ftwrSize: 10,
  remark: 255,
} as const

type TextField = Exclude<
  keyof AddWorkerPayload,
  "passport_photo" | "aadhaar_photo" | "pan_photo" | "contractor_id" | "contractor_name"
>

/** The worker's saved values in form shape - the baseline changedFields() compares against. */
export function storedFormValues(worker: WorkerRecord): EditWorkerFormValues {
  const medical = parseMedical(worker.mdcl)
  return {
    empNo: worker.emp_id || "",
    title: worker.title || "",
    workerName: worker.name || "",
    gender: worker.gender || "",
    dateOfJoining: worker.date_of_joining || "",
    designation: worker.designation || "",
    designationOther: worker.designation_other || "",
    department: worker.department || "",
    departmentOther: worker.department_other || "",
    workLocation: worker.work_location || "",
    workLocationOther: worker.work_location_other || "",
    floor: worker.floor || "",
    floorOther: worker.floor_other || "",
    contactNumber: worker.phone || "",
    email: worker.email || "",
    emergencyContactNumber: worker.emergency_contact_number || "",
    emrcyPNm: worker.emrcy_p_nm || "",
    resp: worker.resp || "",
    emrcyConNo: worker.emrcy_con_no || "",
    dateOfBirth: worker.date_of_birth || "",
    uanNumber: worker.uan_number || "",
    esiNumber: worker.esi_number || "",
    aadharNumber: worker.aadhaar || "",
    panNumber: worker.pan || "",
    address: worker.address || "",
    currentlyStayingType: (worker.currently_staying_type || "") as EditWorkerFormValues["currentlyStayingType"],
    permanentAddress: worker.permanent_address || "",
    rentalAddress: worker.rental_address || "",
    pinCode: worker.pin_code || "",
    bankName: worker.bank_name || "",
    bankAc: worker.bank_ac || "",
    ifscCode: worker.ifsc_code || "",
    aprnSize: worker.aprn_size || "",
    apronLockerNo: worker.apron_locker_no || "",
    ftwrSize: worker.ftwr_size || "",
    mdclDone: medical.done,
    mdclDate: medical.date,
    remark: worker.remark || "",
    passportPhoto: null,
    aadharCard: null,
    panCard: null,
  }
}

/** What the form shows when it opens: the saved values, plus gaps the HR sheet import left. */
export function workerToFormValues(worker: WorkerRecord): EditWorkerFormValues {
  const stored = storedFormValues(worker)
  // Workers imported from the HR sheet have their emergency number only in
  // emrcy_con_no, which left this required field looking empty.
  return { ...stored, emergencyContactNumber: stored.emergencyContactNumber || stored.emrcyConNo }
}

function toApiFields(v: EditWorkerFormValues): Record<TextField, string> {
  return {
    emp_id: v.empNo,
    title: v.title,
    name: v.workerName,
    gender: v.gender,
    date_of_birth: v.dateOfBirth,
    date_of_joining: v.dateOfJoining,
    phone: v.contactNumber,
    email: v.email,
    emergency_contact_number: v.emergencyContactNumber,
    emrcy_p_nm: v.emrcyPNm,
    resp: v.resp,
    emrcy_con_no: v.emrcyConNo,
    designation: v.designation,
    designation_other: v.designationOther,
    department: v.department,
    department_other: v.departmentOther,
    work_location: v.workLocation,
    work_location_other: v.workLocationOther,
    floor: v.floor,
    floor_other: v.floorOther,
    aadhaar: v.aadharNumber,
    pan: v.panNumber,
    uan_number: v.uanNumber,
    esi_number: v.esiNumber,
    address: v.address,
    currently_staying_type: v.currentlyStayingType,
    permanent_address: v.permanentAddress,
    rental_address: v.rentalAddress,
    pin_code: v.pinCode,
    bank_name: v.bankName,
    bank_ac: v.bankAc,
    ifsc_code: v.ifscCode,
    aprn_size: v.aprnSize,
    apron_locker_no: v.apronLockerNo,
    ftwr_size: v.ftwrSize,
    mdcl: formatMedical(v.mdclDone, v.mdclDate),
    remark: v.remark,
  }
}

/**
 * The fields the contractor changed, ready for updateWorker(). Untouched fields are left
 * out so saving never rewrites what is stored (a legacy medical note such as "AUG-2026"
 * used to become "Not done"), and an emptied field is sent as "" so the API clears it
 * (it used to be dropped, so the old value stayed while the save reported success).
 */
export function changedFields(values: EditWorkerFormValues, stored: EditWorkerFormValues): Partial<Record<TextField, string>> {
  const now = toApiFields(values)
  const before = toApiFields(stored)
  return Object.fromEntries(
    (Object.keys(now) as TextField[]).filter((key) => now[key] !== before[key]).map((key) => [key, now[key]])
  )
}
