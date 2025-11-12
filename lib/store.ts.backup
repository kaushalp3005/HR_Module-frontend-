import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface User {
  id: string
  email: string
  name?: string
  role: "hr" | "contractor"
  contractorId?: string
  contractorName?: string
}

export interface Contractor {
  id: string
  name: string
  code: string
  gst: string
  pf: string
  esic: string
  clraValidTill: string
  status: "active" | "inactive" | "suspended"
  contact: string
}

export interface Worker {
  id: string
  name: string
  phone: string
  dob: string
  gender: "male" | "female" | "other"
  contractorId: string
  designation: string
  site: string
  joiningDate: string
  approvalState: "pending" | "approved" | "rejected"
  missingDocs: string[]
  email?: string
  address?: string
  bankAccount?: string
  bankName?: string
  ifsc?: string
  emergencyContact?: string
  emergencyPhone?: string
}

export interface Document {
  id: string
  workerId?: string
  contractorId?: string
  type: string
  number: string
  issuedOn?: string
  validTill?: string
  fileName: string
  notes?: string
  status: "pending" | "approved" | "rejected"
}

interface AppStore {
  user: User | null
  sessionExpiry: number | null
  contractors: Contractor[]
  workers: Worker[]
  documents: Document[]
  approvalQueue: Worker[]

  // Auth
  login: (email: string, role: "hr" | "contractor", contractorId?: string, name?: string) => void
  logout: () => void

  // Contractors
  addContractor: (contractor: Contractor) => void
  updateContractor: (id: string, contractor: Partial<Contractor>) => void
  deleteContractor: (id: string) => void

  // Workers
  addWorker: (worker: Worker) => void
  updateWorker: (id: string, worker: Partial<Worker>) => void
  deleteWorker: (id: string) => void
  submitWorkerForApproval: (workerId: string) => void

  // Documents
  addDocument: (doc: Document) => void
  updateDocument: (id: string, doc: Partial<Document>) => void
  deleteDocument: (id: string) => void

  // Approvals
  approveWorker: (workerId: string, comment: string) => void
  rejectWorker: (workerId: string, reason: string) => void
}

const mockContractors: Contractor[] = [
  {
    id: "c1",
    name: "MuFi Enterprises",
    code: "MUFI001",
    gst: "27AABCT1234H1Z0",
    pf: "DL/CPM/00123456",
    esic: "21000123456789",
    clraValidTill: "2025-12-31",
    status: "active",
    contact: "contact@abcstaffing.com",
  },
  {
    id: "c2",
    name: "Samir Enterprises",
    code: "SAMIR002",
    gst: "27AABCU5678H1Z0",
    pf: "DL/CPM/00654321",
    esic: "21000654321789",
    clraValidTill: "2025-06-30",
    status: "active",
    contact: "info@samirenterprises.com",
  },
]

const mockWorkers: Worker[] = [
  {
    id: "w1",
    name: "Rajesh Kumar",
    phone: "9876543210",
    dob: "1990-05-15",
    gender: "male",
    contractorId: "c1",
    designation: "Welder",
    site: "Site A - Mumbai",
    joiningDate: "2023-01-15",
    approvalState: "pending",
    missingDocs: ["Aadhaar Card", "Medical Fitness Certificate"],
    email: "rajesh@example.com",
  },
  {
    id: "w2",
    name: "Priya Singh",
    phone: "9876543211",
    dob: "1992-08-22",
    gender: "female",
    contractorId: "c1",
    designation: "Supervisor",
    site: "Site B - Delhi",
    joiningDate: "2022-06-10",
    approvalState: "approved",
    missingDocs: [],
    email: "priya@example.com",
  },
]

const SESSION_TTL_MS = 2 * 24 * 60 * 60 * 1000

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      sessionExpiry: null,
      contractors: mockContractors,
      workers: mockWorkers,
      documents: [],
      approvalQueue: [mockWorkers[0]],

      login: (email, role, contractorId, name) => {
        const newSessionExpiry = Date.now() + SESSION_TTL_MS
        set({
          user: {
            id: `user_${Date.now()}`,
            email,
            name,
            role,
            contractorId,
            contractorName: contractorId ? mockContractors.find((c) => c.id === contractorId)?.name : undefined,
          },
          sessionExpiry: newSessionExpiry,
        })
      },

      logout: () => set({ user: null, sessionExpiry: null }),

      addContractor: (contractor) =>
        set((state) => ({
          contractors: [...state.contractors, contractor],
        })),

      updateContractor: (id, updates) =>
        set((state) => ({
          contractors: state.contractors.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteContractor: (id) =>
        set((state) => ({
          contractors: state.contractors.filter((c) => c.id !== id),
        })),

      addWorker: (worker) =>
        set((state) => ({
          workers: [...state.workers, worker],
        })),

      updateWorker: (id, updates) =>
        set((state) => ({
          workers: state.workers.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),

      deleteWorker: (id) =>
        set((state) => ({
          workers: state.workers.filter((w) => w.id !== id),
        })),

      submitWorkerForApproval: (workerId) =>
        set((state) => ({
          workers: state.workers.map((w) => (w.id === workerId ? { ...w, approvalState: "pending" } : w)),
          approvalQueue: [...state.approvalQueue, state.workers.find((w) => w.id === workerId)].filter(
            Boolean,
          ) as Worker[],
        })),

      addDocument: (doc) =>
        set((state) => ({
          documents: [...state.documents, doc],
        })),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),

      approveWorker: (workerId, comment) =>
        set((state) => ({
          workers: state.workers.map((w) => (w.id === workerId ? { ...w, approvalState: "approved" } : w)),
          approvalQueue: state.approvalQueue.filter((w) => w.id !== workerId),
        })),

      rejectWorker: (workerId, reason) =>
        set((state) => ({
          workers: state.workers.map((w) => (w.id === workerId ? { ...w, approvalState: "rejected" } : w)),
          approvalQueue: state.approvalQueue.filter((w) => w.id !== workerId),
        })),
    }),
    {
      name: "app-store",
      version: 1,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      onRehydrateStorage: () => (state) => {
        // Check session expiry after rehydration
        if (state && state.sessionExpiry && state.sessionExpiry <= Date.now()) {
          state.user = null
          state.sessionExpiry = null
        }
      },
      skipHydration: typeof window === "undefined",
    },
  ),
)
