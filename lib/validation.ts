import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const workerPersonalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  dob: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear()
    return age >= 18
  }, "Must be at least 18 years old"),
  gender: z.enum(["male", "female", "other"]),
  email: z.string().email().optional(),
})

export const workerBankSchema = z.object({
  bankAccount: z.string().regex(/^\d{9,18}$/, "Invalid account number"),
  bankName: z.string().min(2, "Bank name required"),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
})

export const documentSchema = z.object({
  type: z.string().min(1, "Document type required"),
  number: z.string().min(1, "Document number required"),
  validTill: z.string().refine((date) => new Date(date) > new Date(), "Date must be in future"),
  file: z.instanceof(File).refine((file) => file.size < 10 * 1024 * 1024, "File must be less than 10MB"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type WorkerPersonalInput = z.infer<typeof workerPersonalSchema>
export type WorkerBankInput = z.infer<typeof workerBankSchema>
export type DocumentInput = z.infer<typeof documentSchema>
