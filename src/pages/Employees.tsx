export default function Employees() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage system users, employee profiles, roles, and supervisor mapping.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Employee Directory Grid</h2>
        <p className="text-sm text-muted-foreground">This panel is restricted to System Administrators.</p>
      </div>
    </div>
  )
}
