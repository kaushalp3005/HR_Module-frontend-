/**
 * Most workers were imported from the HR spreadsheets, so their stored values do not
 * always match the dropdown lists the forms offer - the database holds "Ms.", "Female",
 * "Worker", "Packing" and "A-185- Koparkhairne" where the lists offer "MS", "FEMALE",
 * "LINE WORKER" and "A-185-Koparkhairne". A Select whose value matches no item renders
 * empty, which looked like the worker's data had disappeared on the edit screen.
 *
 * Keeping the stored value as an extra option shows what is actually saved and stops an
 * edit from silently wiping it.
 */
export function optionsWithCurrent(options: readonly string[], current?: string | null): string[] {
  const value = (current ?? "").trim()
  if (!value || options.includes(value)) return [...options]
  return [value, ...options]
}
