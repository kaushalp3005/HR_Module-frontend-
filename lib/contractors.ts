// Contractor logins identify as "c1"/"c2" (lib/auth.ts), but worker records are
// stored under the codes the master sheets were imported with. Translate the
// login's id whenever reading or writing that contractor's workers.
const WORKER_CONTRACTORS: Record<string, { id: string; name: string }> = {
  c1: { id: "MUFI", name: "Mufi Enterprises" },
  c2: { id: "SAM", name: "Sameer Enterprises" },
}

/** The contractor_id on this contractor's worker records. */
export function workerContractorId(loginContractorId: string): string {
  return WORKER_CONTRACTORS[loginContractorId]?.id ?? loginContractorId
}

/** The contractor_name on this contractor's worker records. */
export function workerContractorName(loginContractorId: string): string | undefined {
  return WORKER_CONTRACTORS[loginContractorId]?.name
}
