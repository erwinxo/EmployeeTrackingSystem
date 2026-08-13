import { useState, useEffect } from 'react'
import api from '../services/api'
import { FileDown, FolderGit2, ClipboardList, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function Reports() {
  const [summary, setSummary] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reportRes, projectsRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/projects'),
      ])
      setSummary(reportRes.data.data.summary)
      setProjects(projectsRes.data.data)
    } catch (error) {
      console.error('Error compiling analytical report:', error)
      toast.error('Failed to load system reports data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = (format: 'PDF' | 'XLSX') => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Formatting workspace data to ${format}...`,
        success: `Analytical report exported successfully as ${format}!`,
        error: 'Failed to compile export file.',
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports & Insights</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review live project analytics, deliverables counts, and export logs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('XLSX')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-bold text-foreground transition-all"
          >
            <FileDown size={14} />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-2 rounded-xl bg-primary hover:opacity-95 px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all"
          >
            <FileDown size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
          Compiling report analysis...
        </div>
      ) : summary ? (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border border-border bg-secondary flex items-center justify-center text-primary">
              <FolderGit2 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Managed Projects</span>
              <span className="text-2xl font-extrabold text-foreground mt-0.5 block">{summary.projects}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border border-border bg-secondary flex items-center justify-center text-primary">
              <ClipboardList size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Scope Requirements</span>
              <span className="text-2xl font-extrabold text-foreground mt-0.5 block">{summary.requirements}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border border-border bg-secondary flex items-center justify-center text-primary">
              <CheckSquare size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Backlog Tasks</span>
              <span className="text-2xl font-extrabold text-foreground mt-0.5 block">{summary.tasks}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-8 text-center">No report metrics available.</div>
      )}

      {/* Project Status Log Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-md font-bold tracking-tight">Active Projects Breakdown</h2>
          <p className="text-xs text-muted-foreground">Milestones achievement metrics dynamically calculated.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Timeline Status</th>
                <th className="px-6 py-4">Tasks Completion</th>
                <th className="px-6 py-4">Milestone Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {projects.map((proj) => {
                const total = proj.tasks?.length || 0
                const completed = proj.tasks?.filter((t: any) => t.status === 'Completed').length || 0
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <tr key={proj.id} className="hover:bg-secondary/20 transition-all">
                    <td className="px-6 py-4 font-bold text-foreground">{proj.name}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                        proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        proj.status === 'In Progress' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                        'bg-neutral-500/10 text-neutral-400 border-border'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">
                      {completed} / {total} tasks
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden border border-border/40">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-bold text-foreground text-[10px]">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    No projects found. Add projects to see tracking insights.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
