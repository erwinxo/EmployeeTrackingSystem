import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import api from '../services/api'
import { ClipboardList, Plus, Trash2, Edit2, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function Tasks() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'PROJECT_MANAGER'

  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending')
  const [assignee, setAssignee] = useState('')
  const [projectId, setProjectId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ])
      setTasks(tasksRes.data.data)
      setProjects(projectsRes.data.data)
      if (projectsRes.data.data.length > 0) {
        setProjectId(projectsRes.data.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching tasks details:', error)
      toast.error('Failed to load tasks and projects data')
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
    setStatus('Pending')
    setAssignee('')
    setEditingId(null)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) {
      toast.error('Please create a project first before adding tasks')
      return
    }
    try {
      await api.post('/tasks', {
        title,
        description,
        status,
        assignee: assignee || user?.name || 'Unassigned',
        projectId,
      })
      toast.success('Task created successfully')
      setIsAddModalOpen(false)
      fetchData()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create task'
      toast.error(msg)
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await api.put(`/tasks/${editingId}`, {
        title,
        description,
        status,
        assignee,
        projectId,
      })
      toast.success('Task updated successfully')
      setIsEditModalOpen(false)
      fetchData()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update task'
      toast.error(msg)
    }
  }

  const handleStatusChange = async (task: any, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        assignee: task.assignee,
        projectId: task.projectId,
      })
      toast.success(`Task status updated to ${newStatus}`)
      fetchData()
    } catch (err: any) {
      toast.error('Failed to change task status')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      toast.success('Task deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error('Failed to delete task')
    }
  }

  const openEditModal = (t: any) => {
    setEditingId(t.id)
    setTitle(t.title)
    setDescription(t.description || '')
    setStatus(t.status || 'Pending')
    setAssignee(t.assignee || '')
    setProjectId(t.projectId)
    setIsEditModalOpen(true)
  }

  const getTasksByStatus = (st: 'Pending' | 'In Progress' | 'Completed') => {
    return tasks.filter((t) => t.status === st)
  }

  const statuses: ('Pending' | 'In Progress' | 'Completed')[] = ['Pending', 'In Progress', 'Completed']

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Workflow Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor workflow states: Pending → In Progress → Completed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-all"
            title="Refresh Board"
          >
            <RefreshCw size={16} />
          </button>
          {canManage && (
            <button
              onClick={() => {
                resetForm()
                setIsAddModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-95 transition-all"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Board columns layout */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm font-semibold">
          Loading task details...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {statuses.map((st) => {
            const list = getTasksByStatus(st)
            return (
              <div key={st} className="rounded-2xl border border-border bg-card/40 p-4 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      st === 'Pending' ? 'bg-neutral-500' :
                      st === 'In Progress' ? 'bg-sky-500' :
                      'bg-emerald-500'
                    }`} />
                    <span>{st}</span>
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-muted-foreground">
                      No tasks in this list
                    </div>
                  ) : (
                    list.map((task) => (
                      <div key={task.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div>
                          <span className="text-[9px] font-bold text-primary block uppercase tracking-wider line-clamp-1 mb-1">
                            {task.project?.name || 'Unknown Project'}
                          </span>
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                            Assignee: <span className="text-foreground font-bold">{task.assignee}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Simple Status Shift Select */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value as any)}
                              className="bg-secondary text-[10px] font-bold text-foreground rounded-lg px-2 py-1 border border-border focus:outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>

                            {canManage && (
                              <>
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                                  title="Edit Task"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-all"
                                  title="Delete Task"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span>Create New Task</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code auth route schema validator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Details and checklist for completion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assignee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 transition-all mt-6"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                <span>Edit Task Info</span>
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assignee Name</label>
                  <input
                    type="text"
                    required
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
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
