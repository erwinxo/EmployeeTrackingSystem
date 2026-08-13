import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import api from '../services/api'
import { ClipboardList, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Requirements() {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [requirements, setRequirements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [projectId, setProjectId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reqsRes, projectsRes] = await Promise.all([
        api.get('/requirements'),
        api.get('/projects'),
      ])
      setRequirements(reqsRes.data.data)
      setProjects(projectsRes.data.data)
      if (projectsRes.data.data.length > 0) {
        setProjectId(projectsRes.data.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching requirements:', error)
      toast.error('Failed to load requirements and projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('Medium')
    setEditingId(null)
  }

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) {
      toast.error('Please create a project first before adding requirements')
      return
    }
    try {
      await api.post('/requirements', {
        title,
        description,
        priority,
        projectId,
      })
      toast.success('Requirement added successfully')
      setIsAddModalOpen(false)
      fetchData()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create requirement'
      toast.error(msg)
    }
  }

  const handleEditRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await api.put(`/requirements/${editingId}`, {
        title,
        description,
        priority,
        projectId,
      })
      toast.success('Requirement updated successfully')
      setIsEditModalOpen(false)
      fetchData()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update requirement'
      toast.error(msg)
    }
  }

  const handleDeleteRequirement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client requirement?')) return
    try {
      await api.delete(`/requirements/${id}`)
      toast.success('Requirement deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error('Failed to delete requirement')
    }
  }

  const openEditModal = (req: any) => {
    setEditingId(req.id)
    setTitle(req.title)
    setDescription(req.description || '')
    setPriority(req.priority || 'Medium')
    setProjectId(req.projectId)
    setIsEditModalOpen(true)
  }

  const getPriorityColor = (pr: string) => {
    switch (pr) {
      case 'High':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'Low':
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Client Scope Items</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Maintain high-level functional client requirements tracing.
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
            <span>Add Scope Item</span>
          </button>
        )}
      </div>

      {/* Requirements Table/Card List */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm font-semibold">
          Fetching requirement credentials...
        </div>
      ) : requirements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-bold">No Scope Items Logged</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Link client specifications and deliverables to tracked projects.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Title / ID</th>
                  <th className="px-6 py-4">Associated Project</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Scope Description</th>
                  {isManagerOrAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {requirements.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-secondary/20 transition-all">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{req.title}</span>
                        <span className="text-[10px] text-muted-foreground font-normal mt-0.5">REQ-{100 + idx}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {req.project?.name || 'Unknown Project'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase ${getPriorityColor(req.priority)}`}>
                        {req.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {req.description || 'No descriptive scope provided.'}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(req)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Edit Scope"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRequirement(req.id)}
                            className="p-1.5 rounded-lg text-rose-500/75 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            title="Delete Scope"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Requirement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span>Create Scope Item</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scope Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FR-01: Auto-save settings panels"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scope Description</label>
                <textarea
                  placeholder="Detailed functional and operational parameters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Associate Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 transition-all mt-6"
              >
                Save Scope Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                <span>Edit Scope Details</span>
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditRequirement} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scope Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Scope Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Associate Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
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
