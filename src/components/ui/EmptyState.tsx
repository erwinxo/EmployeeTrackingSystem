import * as React from 'react'
import { cn } from '../../utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-card/20 animate-fade-in', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground border border-border/40 mb-4">
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      {description && <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
