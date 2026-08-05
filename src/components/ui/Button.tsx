import * as React from 'react'
import { cn } from '../../utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          // Variants
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/25 active:scale-[0.98]',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
          variant === 'outline' && 'border border-border bg-card text-foreground hover:bg-accent active:scale-[0.98]',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'link' && 'text-primary underline-offset-4 hover:underline',
          // Sizes
          size === 'default' && 'h-10 px-4 py-2.5',
          size === 'sm' && 'h-8 px-3 rounded-lg text-[11px]',
          size === 'lg' && 'h-11 px-6 text-sm rounded-xl',
          size === 'icon' && 'h-9 w-9 rounded-lg p-1.5 border border-border bg-background hover:bg-accent text-muted-foreground',
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
