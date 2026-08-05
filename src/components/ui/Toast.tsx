import * as React from 'react'
import { cn } from '../../utils'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: (id: string) => void
}

export function Toast({ id, message, type = 'info', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xl pointer-events-auto min-w-[280px] max-w-sm animate-slide-in-right',
      type === 'success' && 'border-emerald-500/20 text-foreground',
      type === 'error' && 'border-rose-500/20 text-foreground',
      type === 'info' && 'border-border text-foreground'
    )}>
      {type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
      {type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />}
      {type === 'info' && <Info className="h-5 w-5 text-primary shrink-0" />}
      
      <p className="text-xs font-semibold flex-1">{message}</p>
      
      <button 
        onClick={() => onClose(id)}
        className="rounded hover:bg-accent p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
