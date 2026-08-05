import * as React from 'react'
import { cn } from '../../utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, size = 'md', children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Dialog Window */}
      <div className={cn(
        'relative w-full transform overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 animate-scale-up text-left z-10',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-md',
        size === 'lg' && 'max-w-lg',
        size === 'xl' && 'max-w-2xl',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-base font-bold tracking-tight text-foreground">
              {title}
            </h3>
          )}
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="text-xs text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}
