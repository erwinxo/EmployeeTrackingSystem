import { cn } from '../../utils'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-foreground',
          size === 'sm' && 'h-4 w-4 border-[1.5px]',
          size === 'md' && 'h-8 w-8',
          size === 'lg' && 'h-12 w-12 border-3'
        )}
      />
    </div>
  )
}
