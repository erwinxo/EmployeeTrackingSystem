import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import api from '../services/api'
import { FolderGit2, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Projects() {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'Planning' | 'In Progress' | 'Completed' | 'On Hold'>('Planning')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await api.get('/projects')
      setProjects(response.data.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const resetForm = () => {
    setName('')
    setDescription('')
    setStatus('Planning')
    setEditingId(null)
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/projects', {
        name,
        description,
        status,
      })
      toast.success('Project created successfully')
      setIsAddModalOpen(false)
      fetchProjects()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create project'
      toast.error(msg)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await api.put(`/projects/${editingId}`, {
        name,
        description,
        status,
      })
      toast.success('Project updated successfully')
      setIsEditModalOpen(false)
      fetchProjects()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update project'
      toast.error(msg)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks and requirements will be affected.')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete project'
      toast.error(msg)
    }
  }

  const openEditModal = (proj: any) => {
    setEditingId(proj.id)
    setName(proj.name)
    setDescription(proj.description || '')
    setStatus(proj.status || 'Planning')
    setIsEditModalOpen(true)
  }

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Planning':
        return 'bg-neutral-500/10 text-neutral-400 border-border'
      case 'In Progress':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20'
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-secondary text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track allocations, project scopes, and overall timeline status.
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => {
              resetForm()
              setIsAddModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Filters UI */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
          >
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm font-semibold">
          Fetching projects from database...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-bold">No Projects Active</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Get started by logging the workspace's first project.
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-12 text-center shadow-sm">
          <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
          <h3 className="mt-3 text-xs font-bold">No Matching Projects</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            No projects match the filters you've applied. Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((proj) => {
            const totalTasks = proj.tasks?.length || 0
            const completedTasks = proj.tasks?.filter((t: any) => t.status === 'Completed').length || 0
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <div key={proj.id} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase ${getStatusColor(proj.status)}`}>
                      {proj.status}
                    </span>
                    <FolderGit2 size={18} className="text-primary" />
                  </div>

                  <h3 className="text-md font-bold text-foreground mb-1.5">{proj.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-6 min-h-[48px]">{proj.description || 'No description provided.'}</p>
                  
                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase tracking-wide">Tasks Progress</span>
                      <span className="text-foreground">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4 text-center">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block">Tasks</span>
                      <span className="text-sm font-extrabold text-foreground">{totalTasks}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block">Scope Items</span>
                      <span className="text-sm font-extrabold text-foreground">{proj.requirements?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Edit Project"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 rounded-lg text-rose-500/75 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                <span>Create New Project</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ERP Engine 2.0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Detailed description of the project target..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 transition-all mt-6"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                <span>Edit Project</span>
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditProject} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 transition-all mt-6"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
