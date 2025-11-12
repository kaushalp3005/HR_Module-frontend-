"use client"

import type React from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  hidden?: boolean
  width?: string
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
}

export function ResponsiveTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  actions,
}: ResponsiveTableProps<T>) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const visibleColumns = columns.filter((col) => !col.hidden)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition((e.target as HTMLDivElement).scrollLeft)
  }

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto" onScroll={handleScroll}>
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className="text-xs sm:text-sm font-semibold text-foreground px-2 sm:px-4 py-2 sm:py-3"
                  style={{ width: col.width }}
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && (
                <TableHead className="text-xs sm:text-sm font-semibold text-foreground px-2 sm:px-4 py-2 sm:py-3 w-24">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (actions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 truncate"
                      style={{ width: col.width }}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 w-24">{actions(row)}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
