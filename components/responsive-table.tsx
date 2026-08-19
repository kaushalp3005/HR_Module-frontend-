"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
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
  /**
   * Fit every column inside the available width (no horizontal scrolling) and let long
   * cell values wrap onto multiple lines instead of being cut off with an ellipsis.
   * Rows grow taller as needed so the full value stays readable.
   */
  fitWidth?: boolean
  /** Width of the trailing actions column, e.g. "12%" or "150px". */
  actionsWidth?: string
}

export function ResponsiveTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  actions,
  fitWidth = false,
  actionsWidth,
}: ResponsiveTableProps<T>) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const visibleColumns = columns.filter((col) => !col.hidden)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition((e.target as HTMLDivElement).scrollLeft)
  }

  // In fitWidth mode the inner container of <Table /> must not scroll either.
  const scrollAreaClass = fitWidth
    ? "w-full overflow-x-hidden [&_[data-slot=table-container]]:overflow-x-hidden"
    : "overflow-x-auto"

  const headClass = cn(
    "text-xs sm:text-sm font-semibold text-foreground px-2 sm:px-4 py-2 sm:py-3",
    fitWidth && "whitespace-normal break-words align-bottom",
  )

  const cellClass = cn(
    "text-xs sm:text-sm px-2 sm:px-4",
    fitWidth
      ? "py-3 sm:py-4 align-middle whitespace-normal break-words leading-snug"
      : "py-2 sm:py-3 truncate",
  )

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <div className={scrollAreaClass} onScroll={fitWidth ? undefined : handleScroll}>
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={String(col.key)} className={headClass} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              {actions && (
                <TableHead
                  className={cn(headClass, !actionsWidth && "w-24")}
                  style={actionsWidth ? { width: actionsWidth } : undefined}
                >
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
                    <TableCell key={String(col.key)} className={cellClass} style={{ width: col.width }}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      className={cn(cellClass, !actionsWidth && "w-24")}
                      style={actionsWidth ? { width: actionsWidth } : undefined}
                    >
                      {actions(row)}
                    </TableCell>
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
