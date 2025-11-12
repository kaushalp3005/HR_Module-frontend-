"use client"

import { ResponsivePageHeader } from "@/components/responsive-page-header"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"

export default function ContractorsPage() {
  // Static contractor data as requested
  const contractors = [
    {
      id: "1",
      name: "Samir Enterprises",
      email: "alsakhienterprises27@gmail.com",
      status: "active"
    },
    {
      id: "2", 
      name: "Mufi Enterprises",
      email: "alsakhienterprises27@gmail.com",
      status: "active"
    }
  ]

  const columns = [
    {
      key: "name" as const,
      label: "Contractor Name",
      render: (value: string) => <span className="font-medium text-sm sm:text-base">{value}</span>,
    },
    {
      key: "email" as const,
      label: "Email",
      render: (value: string) => <span className="text-xs sm:text-sm text-muted-foreground">{value}</span>,
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === "active" ? "default" : "secondary"} className="text-xs sm:text-sm">
          {value}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <ResponsivePageHeader
        title="Contractors"
        subtitle="View contractor information and status"
      />

      <div className="rounded-lg border border-border overflow-hidden">
        <ResponsiveTable
          columns={columns}
          data={contractors}
        />
      </div>
    </div>
  )
}
