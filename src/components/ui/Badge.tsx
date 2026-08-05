import * as React from 'react'
import { cn } from '../../utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'default'
  dot?: boolean
}

function Badge({ className, variant = 'default', size = 'default', dot = false, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-semibold border transition-all duration-200 select-none',
        // Variants
        variant === 'default' && 'bg-primary/10 text-primary border-primary/20',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground border-border/40',
        variant === 'outline' && 'bg-background text-foreground border-border',
        variant === 'destructive' && 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/15',
        variant === 'success' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/15',
        variant === 'warning' && 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/15',
        variant === 'info' && 'bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/15',
        // Sizes
        size === 'default' && 'px-2 py-0.5 text-[10px]',
        size === 'sm' && 'px-1.5 py-0.2 text-[9px]',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'info' && 'bg-sky-500',
            variant === 'destructive' && 'bg-rose-500',
            variant === 'default' && 'bg-primary',
            variant === 'secondary' && 'bg-muted-foreground'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge }
