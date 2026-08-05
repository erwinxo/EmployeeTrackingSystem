export default function Tasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor workflow states: In Progress → Review → Finished.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Task Workflow Board</h2>
        <p className="text-sm text-muted-foreground">Collaborative board displaying assigned tasks and priority labels.</p>
      </div>
    </div>
  )
}
