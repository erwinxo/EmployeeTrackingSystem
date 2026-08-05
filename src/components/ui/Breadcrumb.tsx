import * as React from 'react'
import { cn } from '../../utils'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-xs text-muted-foreground font-semibold', className)}>
      <a href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home size={14} />
      </a>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} className="text-muted-foreground/50 shrink-0" />
          {item.href ? (
            <a href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-extrabold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
