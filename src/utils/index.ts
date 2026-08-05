import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Shadcn style class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date string to readable format
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date)
}

// Format relative time (e.g. "2 hours ago", "Yesterday")
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 172800) return 'Yesterday'
  return formatDate(dateString)
}

// Hours formatter
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`
}

// CSV Export Utility Placeholder
export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || !rows.length) return
  const separator = ','
  const keys = Object.keys(rows[0])
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            const raw = row[k] === null || row[k] === undefined ? '' : row[k]
            let strVal = raw instanceof Date ? raw.toLocaleString() : String(raw)
            strVal = strVal.replace(/"/g, '""')
            if (strVal.search(/("|,|\n)/g) >= 0) {
              strVal = `"${strVal}"`
            }
            return strVal
          })
          .join(separator)
      })
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// PDF Export Placeholder Utility
export function exportToPDF(filename: string): void {
  window.print()
  console.log(`PDF print export triggered for ${filename}`)
}
