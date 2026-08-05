import { cn } from '../../utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn('flex items-center justify-between gap-4 mt-6', className)}>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 px-2"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 px-2"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
