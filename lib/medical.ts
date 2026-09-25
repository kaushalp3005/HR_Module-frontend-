// The workers_data.mdcl column is free-text varchar. New records store either an
// ISO date (medical done, on that date) or NOT_DONE. Older rows hold typed-in text
// such as "AUG-2026" or "VACCINE NOT GIVEN", so reading has to cope with anything.

export const MEDICAL_NOT_DONE = "Not done"

/** Reads a stored mdcl value into the checkbox + date pair the forms use. */
export function parseMedical(value?: string | null): { done: boolean; date: string; legacy: string } {
  const text = (value ?? "").trim()
  if (!text) return { done: false, date: "", legacy: "" }

  // "2026-04-01" and "2026-04-01 00:00:00" both start with an ISO date.
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoDate) return { done: true, date: isoDate[1], legacy: "" }

  // Anything else is free text typed before this form existed; keep it visible
  // instead of guessing a date from it.
  const notDone = text.toLowerCase() === MEDICAL_NOT_DONE.toLowerCase()
  return { done: false, date: "", legacy: notDone ? "" : text }
}

/** Builds the value to store from the checkbox + date pair. */
export function formatMedical(done: boolean, date: string): string {
  return done && date ? date : MEDICAL_NOT_DONE
}
