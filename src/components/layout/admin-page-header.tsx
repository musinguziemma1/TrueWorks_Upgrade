import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  action?: ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 mb-6 border-b border-border/60",
        className
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <li key={crumb.label + index} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                  {isLast || !crumb.href ? (
                    <span
                      className={cn(
                        "font-medium",
                        isLast ? "text-foreground" : "text-muted-foreground"
                      )}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="font-medium transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0 sm:pt-1">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
