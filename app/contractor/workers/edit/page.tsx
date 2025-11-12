"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function EditWorkerPage() {
  useEffect(() => {
    // Redirect to the workers list page since we don't have a generic edit page
    // Individual worker edits should use the dynamic route /contractor/workers/edit/[id]
    redirect("/contractor/workers")
  }, [])

  return null
}
