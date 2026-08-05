export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytical Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate, filter, and export weekly, monthly, and project-wise tracking sheets.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Export Controls Panel</h2>
        <p className="text-sm text-muted-foreground">Select report formats to download spreadsheet (Excel) or printer (PDF) documents.</p>
      </div>
    </div>
  )
}
