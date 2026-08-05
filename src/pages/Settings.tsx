export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure profile settings, regional configurations, and theme attributes.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Workspace Controls</h2>
        <p className="text-sm text-muted-foreground">Adjust display modes and account sync options.</p>
      </div>
    </div>
  )
}
