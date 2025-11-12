import type React from "react"

interface ResponsivePageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function ResponsivePageHeader({ title, subtitle, actions }: ResponsivePageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">{actions}</div>}
    </div>
  )
}
