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
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED'>('TODO')
  const [assignee, setAssignee] = useState('')
  const [projectId, setProjectId] = useState('')
  const [requirementId, setRequirementId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const normalizeStatus = (st: string): 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED' => {
    switch (st) {
      case 'Pending':
      case 'To Do':
      case 'TODO':
        return 'TODO'
      case 'In Progress':
      case 'IN_PROGRESS':
        return 'IN_PROGRESS'
      case 'In Review':
      case 'REVIEW':
        return 'REVIEW'
      case 'Completed':
      case 'Finished':
      case 'FINISHED':
        return 'FINISHED'
      default:
        return 'TODO'
    }
  }

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'TODO': return 'To Do'
      case 'IN_PROGRESS': return 'In Progress'
      case 'REVIEW': return 'In Review'
      case 'FINISHED': return 'Finished'
      default: return st
    }
  }

  const getRequirementLabel = (reqId: string) => {
    const idx = requirements.findIndex((r) => r.id === reqId)
    if (idx !== -1) {
      return `REQ-${100 + idx}`
    }
    return 'REQ'
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, projectsRes, reqsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/requirements'),
      ])
      setTasks(tasksRes.data.data)
      setProjects(projectsRes.data.data)
      setRequirements(reqsRes.data.data)
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
    setStatus('TODO')
    setAssignee('')
    setRequirementId('')
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
        requirementId: requirementId || null,
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
        requirementId: requirementId || null,
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

  const handleStatusChange = async (task: any, newStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED') => {
    try {
      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        assignee: task.assignee,
        projectId: task.projectId,
        requirementId: task.requirementId || null,
      })
      toast.success(`Task status updated to ${getStatusLabel(newStatus)}`)
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
    setStatus(normalizeStatus(t.status))
    setAssignee(t.assignee || '')
    setProjectId(t.projectId)
    setRequirementId(t.requirementId || '')
    setIsEditModalOpen(true)
  }

  const getTasksByStatus = (st: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED') => {
    return tasks.filter((t) => normalizeStatus(t.status) === st)
  }

  const statuses: ('TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED')[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'FINISHED']

  const projectRequirements = requirements.filter((r) => r.projectId === projectId)

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Workflow Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor deliverables: To Do → In Progress → In Review → Finished. Drag and drop to update.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statuses.map((st) => {
            const list = getTasksByStatus(st)
            return (
              <div
                key={st}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  const taskId = e.dataTransfer.getData('text/plain')
                  const targetTask = tasks.find((t) => t.id === taskId)
                  if (targetTask && normalizeStatus(targetTask.status) !== st) {
                    await handleStatusChange(targetTask, st)
                  }
                }}
                className="rounded-2xl border border-border bg-card/40 p-4 flex flex-col min-h-[450px] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      st === 'TODO' ? 'bg-neutral-500' :
                      st === 'IN_PROGRESS' ? 'bg-sky-500' :
                      st === 'REVIEW' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <span>{getStatusLabel(st)}</span>
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {list.length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-muted-foreground border border-dashed border-border/40 rounded-xl">
                      Drop tasks here
                    </div>
                  ) : (
                    list.map((task) => (
                      <div
                        key={task.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id)
                        }}
                        className="group relative rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all space-y-3 cursor-grab active:cursor-grabbing"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[9px] font-bold text-primary block uppercase tracking-wider truncate max-w-[120px]">
                              {task.project?.name || 'Unknown Project'}
                            </span>
                            {task.requirement && (
                              <span
                                className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary border border-primary/20 cursor-help"
                                title={`Linked Requirement: ${task.requirement.title}`}
                              >
                                {getRequirementLabel(task.requirementId || task.requirement.id)}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-foreground leading-snug break-words">{task.title}</h4>
                          {task.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[9px] font-semibold text-muted-foreground leading-none">
                            By: <span className="text-foreground font-bold">{task.assignee || 'Unassigned'}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Simple Status Shift Select */}
                            <select
                              value={normalizeStatus(task.status)}
                              onChange={(e) => handleStatusChange(task, e.target.value as any)}
                              className="bg-secondary text-[9px] font-bold text-foreground rounded-lg px-1.5 py-0.5 border border-border focus:outline-none cursor-pointer"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">In Review</option>
                              <option value="FINISHED">Finished</option>
                            </select>

                            {canManage && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                                  title="Edit Task"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-all"
                                  title="Delete Task"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link Requirement</label>
                  <select
                    value={requirementId}
                    onChange={(e) => setRequirementId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">None (Unlinked)</option>
                    {projectRequirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {getRequirementLabel(r.id)}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="FINISHED">Finished</option>
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link Requirement</label>
                  <select
                    value={requirementId}
                    onChange={(e) => setRequirementId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">None (Unlinked)</option>
                    {projectRequirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {getRequirementLabel(r.id)}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="FINISHED">Finished</option>
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
