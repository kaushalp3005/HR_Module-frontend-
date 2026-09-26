// Single source of truth for which worker fields the UI shows and exports.
// Keep this in sync with serialize_worker() in backend/app/routers/worker_routes.py.

export interface WorkerRecord {
  id: string | number
  sr_no?: number
  emp_id?: string
  old_employee_id?: string
  title?: string
  name: string
  gender?: string
  date_of_birth?: string
  date_of_joining?: string
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
  warehouse?: string
  aadhaar?: string
  pan?: string
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
  aprn_allocation_status?: string
  apron_locker_no?: string
  ftwr_size?: string
  ftwr_allocation_status?: string
  mdcl?: string
  vaccination?: string
  remark?: string
  resigned_date?: string
  contractor_id: string
  contractor_name?: string
  status: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at?: string
  updated_at?: string
  passport_photo_url?: string
  aadhaar_photo_url?: string
  pan_photo_url?: string
}

export type SectionKey =
  | "personal"
  | "emergency"
  | "work"
  | "government"
  | "address"
  | "banking"
  | "additional"
  | "status"

interface FieldDef {
  key: keyof WorkerRecord
  label: string
  /** "datetime" values are timestamps; "mono" renders in a fixed-width font (IDs, account numbers). */
  kind?: "datetime" | "mono"
  /** Column shown when `key` is empty - for values the HR sheet import stored under another column. */
  fallback?: keyof WorkerRecord
}

interface SectionDef {
  key: SectionKey
  title: string
  fields: FieldDef[]
}

export const WORKER_SECTIONS: SectionDef[] = [
  {
    key: "personal",
    title: "Personal Information",
    fields: [
      { key: "sr_no", label: "Sr. No." },
      { key: "emp_id", label: "Employee ID" },
      { key: "old_employee_id", label: "Old Employee ID" },
      { key: "title", label: "Title" },
      { key: "name", label: "Full Name" },
      { key: "gender", label: "Gender" },
      { key: "date_of_birth", label: "Date of Birth" },
      { key: "phone", label: "Phone Number" },
      { key: "email", label: "Email Address" },
      { key: "date_of_joining", label: "Date of Joining" },
      { key: "created_at", label: "Application Date", kind: "datetime" },
    ],
  },
  {
    key: "emergency",
    title: "Emergency Contact",
    fields: [
      // The HR sheet import put each worker's emergency number in emrcy_con_no
      // (beside emrcy_p_nm / resp) and left emergency_contact_number empty.
      { key: "emergency_contact_number", label: "Emergency Contact Number", fallback: "emrcy_con_no" },
      { key: "emrcy_p_nm", label: "Emergency Person Name" },
      { key: "resp", label: "Relationship" },
      { key: "emrcy_con_no", label: "Alternate Emergency Number" },
    ],
  },
  {
    key: "work",
    title: "Work Information",
    fields: [
      { key: "designation", label: "Designation" },
      { key: "designation_other", label: "Designation (Other)" },
      { key: "department", label: "Department" },
      { key: "department_other", label: "Department (Other)" },
      { key: "work_location", label: "Work Location" },
      { key: "work_location_other", label: "Work Location (Other)" },
      { key: "floor", label: "Floor" },
      { key: "floor_other", label: "Floor (Other)" },
      { key: "warehouse", label: "Warehouse" },
      { key: "contractor_name", label: "Contractor" },
      { key: "contractor_id", label: "Contractor ID" },
    ],
  },
  {
    key: "government",
    title: "Government IDs & Numbers",
    fields: [
      { key: "aadhaar", label: "Aadhaar Number", kind: "mono" },
      { key: "pan", label: "PAN Number", kind: "mono" },
      { key: "uan_number", label: "UAN Number", kind: "mono" },
      { key: "esi_number", label: "ESI Number", kind: "mono" },
    ],
  },
  {
    key: "address",
    title: "Address Information",
    fields: [
      { key: "address", label: "Current Address" },
      { key: "currently_staying_type", label: "Staying Type" },
      { key: "permanent_address", label: "Permanent Address" },
      { key: "rental_address", label: "Rental Address" },
      { key: "pin_code", label: "PIN Code" },
    ],
  },
  {
    key: "banking",
    title: "Banking Information",
    fields: [
      { key: "bank_name", label: "Bank Name" },
      { key: "bank_ac", label: "Account Number", kind: "mono" },
      { key: "ifsc_code", label: "IFSC Code", kind: "mono" },
    ],
  },
  {
    key: "additional",
    title: "Uniform & Medical",
    fields: [
      { key: "aprn_size", label: "Apron Size" },
      { key: "aprn_allocation_status", label: "Apron Allocation Status" },
      { key: "apron_locker_no", label: "Apron Locker No." },
      { key: "ftwr_size", label: "Footwear Size" },
      { key: "ftwr_allocation_status", label: "Footwear Allocation Status" },
      { key: "mdcl", label: "Medical Status" },
      { key: "vaccination", label: "Vaccination" },
      { key: "remark", label: "Remark" },
    ],
  },
  {
    key: "status",
    title: "Status & Approval",
    fields: [
      { key: "status", label: "Status" },
      { key: "resigned_date", label: "Resigned Date" },
      { key: "approved_by", label: "Approved By" },
      { key: "approved_at", label: "Approved At", kind: "datetime" },
      { key: "rejection_reason", label: "Rejection Reason" },
      { key: "updated_at", label: "Last Updated", kind: "datetime" },
    ],
  },
]

function toText(raw: unknown): string {
  return raw === null || raw === undefined ? "" : String(raw).trim()
}

function formatValue(worker: WorkerRecord, field: FieldDef): string {
  const text = toText(worker[field.key]) || (field.fallback ? toText(worker[field.fallback]) : "")
  if (!text) return ""
  if (field.kind === "datetime") {
    const parsed = new Date(text)
    return isNaN(parsed.getTime()) ? text : parsed.toLocaleString()
  }
  return text
}

export const NOT_FILLED = "Not filled"

/** Every section and field for the details dialogs; empty columns read "Not filled". */
export function getWorkerSections(worker: WorkerRecord) {
  return WORKER_SECTIONS.map((section) => ({
    key: section.key,
    title: section.title,
    fields: section.fields.map((field) => {
      const value = formatValue(worker, field)
      return { label: field.label, value: value || NOT_FILLED, empty: !value, mono: field.kind === "mono" }
    }),
  }))
}

/** One Excel row per worker with every field, so all sheets share the same columns; empty values stay blank. */
export function workerToExcelRow(worker: WorkerRecord): Record<string, string> {
  const row: Record<string, string> = {}
  for (const section of WORKER_SECTIONS) {
    for (const field of section.fields) {
      row[field.label] = formatValue(worker, field)
    }
  }
  return row
}
