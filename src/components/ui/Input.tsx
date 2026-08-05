import * as React from 'react'
import { cn } from '../../utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string; size?: number }>
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon: Icon, ...props }, ref) => {
    if (Icon) {
      return (
        <div className="relative w-full">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-primary',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-primary',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
