import { useState, useEffect } from 'react'
import { useAuth, useSocket } from '../hooks'
import api from '../services/api'
import { Users, Building2, ShieldCheck, Search, Plus, Trash2, Edit2, UserPlus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { User, UserRole } from '../types'

const AVATARS = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238696a0'><rect width='24' height='24' fill='%23e9edef'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230288d1'><rect width='24' height='24' fill='%23e1f5fe'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232e7d32'><rect width='24' height='24' fill='%23e8f5e9'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233f51b5'><rect width='24' height='24' fill='%23e8eaf6'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238e24aa'><rect width='24' height='24' fill='%23f3e5f5'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef6c00'><rect width='24' height='24' fill='%23fff3e0'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c62828'><rect width='24' height='24' fill='%23ffebee'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
]

interface DbUserExtended extends User {
  isActive: boolean
}

export default function Employees() {
  const { user: currentUser } = useAuth()
  const { onlineUsers } = useSocket()
  const isAdmin = currentUser?.role === 'ADMIN'

  const [employees, setEmployees] = useState<DbUserExtended[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('EMPLOYEE')
  const [department, setDepartment] = useState('Engineering')
  const [isActive, setIsActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Tasks Assign State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [taskSearchTerm, setTaskSearchTerm] = useState('')

  // Project Manager Assignment State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await api.get('/users')
      const mapped = response.data.data.map((u: any, idx: number) => ({
        id: u.id,
        name: u.fullName || u.name || 'Anonymous User',
        email: u.email,
        role: (u.role || 'EMPLOYEE').toUpperCase() as UserRole,
        avatar: AVATARS[idx % AVATARS.length],
        department: u.department || 'Engineering',
        isActive: u.isActive ?? true,
        projectId: u.projectId,
      }))
      setEmployees(mapped)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to load employee list from database')
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks')
      setTasks(response.data.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchTasks()
    fetchProjects()
  }, [])

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('EMPLOYEE')
    setDepartment('Engineering')
    setIsActive(true)
    setEditingId(null)
    setSelectedTaskIds([])
    setTaskSearchTerm('')
    setSelectedProjectId('')
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/users', {
        fullName,
        email,
        password,
        role,
        department,
        taskIds: role === 'EMPLOYEE' ? selectedTaskIds : [],
        projectId: (role === 'EMPLOYEE' || role === 'PROJECT_MANAGER') ? selectedProjectId : undefined,
      })
      toast.success('Employee created successfully')
      setIsAddModalOpen(false)
      fetchEmployees()
      fetchTasks()
      fetchProjects()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create employee'
      toast.error(msg)
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await api.put(`/users/${editingId}`, {
        fullName,
        email,
        role,
        department,
        isActive,
        taskIds: role === 'EMPLOYEE' ? selectedTaskIds : [],
        projectId: (role === 'EMPLOYEE' || role === 'PROJECT_MANAGER') ? selectedProjectId : undefined,
      })
      toast.success('Employee updated successfully')
      setIsEditModalOpen(false)
      fetchEmployees()
      fetchTasks()
      fetchProjects()
      resetForm()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update employee'
      toast.error(msg)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('Employee deleted successfully')
      fetchEmployees()
      fetchTasks()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete employee'
      toast.error(msg)
    }
  }

  const openEditModal = (emp: DbUserExtended) => {
    setEditingId(emp.id)
    setFullName(emp.name)
    setEmail(emp.email)
    setRole(emp.role)
    setDepartment(emp.department || 'Engineering')
    setIsActive(emp.isActive)
    const userTasks = tasks.filter(t => t.assignee === emp.name).map(t => t.id)
    setSelectedTaskIds(userTasks)
    setTaskSearchTerm('')
    const pmProject = projects.find(p => p.projectManagerId === emp.id)
    setSelectedProjectId(emp.projectId || (pmProject ? pmProject.id : ''))
    setIsEditModalOpen(true)
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Statistics calculation
  const totalEmployees = employees.length
  const uniqueDepartments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).length
  const supervisors = employees.filter((e) => ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'].includes(e.role)).length
  const staff = totalEmployees - supervisors

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage system access roles, department allocations, and employee status.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm()
              setIsAddModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Staff Rosters</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight">{totalEmployees}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Registered accounts in workspace</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Departments</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight">{uniqueDepartments}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Different functional team segments</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Privilege Mix</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight">
              {supervisors} : {staff}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{supervisors} Managers vs. {staff} Core Staff members</p>
        </div>
      </div>

      {/* Directory Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Employees Grid/List */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm font-semibold">
          Fetching directory credentials...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-bold">No Employees Found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            {searchTerm ? 'No results matched your filter keyword.' : 'Get started by adding employee credentials to the system.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-border/80 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={emp.avatar} alt={emp.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                      onlineUsers.includes(emp.id) ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} title={onlineUsers.includes(emp.id) ? 'Online' : 'Offline'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{emp.name}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{emp.email}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase ${
                    emp.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    emp.role === 'MANAGER' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                    emp.role === 'PROJECT_MANAGER' ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' :
                    'bg-neutral-500/10 text-muted-foreground border-border'
                  }`}>
                    {emp.role.replace('_', ' ')}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold bg-secondary border border-border text-muted-foreground">
                    {emp.department}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase flex items-center gap-1 ${
                    (emp.currentStatus || 'OFF_WORK') === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    (emp.currentStatus || 'OFF_WORK') === 'BREAK' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    (emp.currentStatus || 'OFF_WORK') === 'LUNCH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-neutral-500/10 text-muted-foreground border-border'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      (emp.currentStatus || 'OFF_WORK') === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                      (emp.currentStatus || 'OFF_WORK') === 'BREAK' ? 'bg-rose-500 animate-pulse' :
                      (emp.currentStatus || 'OFF_WORK') === 'LUNCH' ? 'bg-amber-500 animate-pulse' :
                      'bg-neutral-400'
                    }`} />
                    {(emp.currentStatus || 'OFF_WORK').replace('_', ' ')}
                  </span>
                </div>

                {/* Role-Specific Scope & Assignment Display */}
                {emp.role === 'PROJECT_MANAGER' ? (
                  <div className="mt-3.5 pt-3 border-t border-border/40">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Assigned Project Scope
                    </h4>
                    {(() => {
                      const pmProj = projects.find(p => p.projectManagerId === emp.id);
                      return pmProj ? (
                        <div className="flex items-center justify-between text-[11px] bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold text-primary truncate">{pmProj.name}</span>
                          <span className="text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                            PM
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic pl-1">No project assigned</p>
                      );
                    })()}
                  </div>
                ) : emp.role === 'MANAGER' ? (
                  <div className="mt-3.5 pt-3 border-t border-border/40">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Assigned Scope
                    </h4>
                    <div className="flex items-center justify-between text-[11px] bg-sky-500/5 border border-sky-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="font-semibold text-sky-500 truncate">All Projects (Default)</span>
                      <span className="text-[8px] font-bold bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded border border-sky-500/20">
                        MANAGER
                      </span>
                    </div>
                  </div>
                ) : emp.role === 'ADMIN' ? (
                  <div className="mt-3.5 pt-3 border-t border-border/40">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      System Scope
                    </h4>
                    <div className="flex items-center justify-between text-[11px] bg-rose-500/5 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="font-semibold text-rose-500 truncate">Global System (Owner)</span>
                      <span className="text-[8px] font-bold bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20">
                        ADMIN
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-[10px] bg-secondary/40 border border-border/60 rounded-lg px-2.5 py-1">
                      <span className="font-semibold text-muted-foreground uppercase text-[8px]">Project</span>
                      {(() => {
                        const empProj = projects.find(p => p.id === emp.projectId);
                        return empProj ? (
                          <span className="font-bold text-foreground truncate max-w-[130px]">{empProj.name}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">No Project Assigned</span>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Assigned Tasks ({tasks.filter(t => t.assignee === emp.name).length})
                      </h4>
                      {tasks.filter(t => t.assignee === emp.name).slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px] bg-secondary/30 border border-border/50 rounded-lg px-2.5 py-1">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{t.title}</span>
                          <span className="text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/10 capitalize">
                            {t.status.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                      {tasks.filter(t => t.assignee === emp.name).length > 3 && (
                        <p className="text-[9px] text-muted-foreground pl-1">
                          + {tasks.filter(t => t.assignee === emp.name).length - 3} more tasks
                        </p>
                      )}
                      {tasks.filter(t => t.assignee === emp.name).length === 0 && (
                        <p className="text-[10px] text-muted-foreground/60 italic pl-1">No tasks assigned</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="p-1.5 rounded-lg text-rose-500/75 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                    title="Remove Employee"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Register Employee</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Access Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                    <option value="Security">Security</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {/* Project Assignment for Project Managers */}
              {role === 'PROJECT_MANAGER' && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">Select Project (Unassigned)</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project & Task Assignment for Employees */}
              {role === 'EMPLOYEE' && (
                <>
                  <div className="space-y-1.5 mt-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Project</label>
                    <select
                      required
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value)
                        setSelectedTaskIds([]) // Clear task assignments when switching projects
                      }}
                      className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="">Select Project (Required)</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProjectId ? (
                    <div className="space-y-1.5 mt-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assign Tasks ({selectedTaskIds.length} selected)</label>
                      <input
                        type="text"
                        placeholder="Search tasks by title..."
                        value={taskSearchTerm}
                        onChange={(e) => setTaskSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/50 py-2 px-3 text-xs outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                      />
                      <div className="border border-border rounded-xl bg-background/50 divide-y divide-border/60 max-h-36 overflow-y-auto">
                        {(() => {
                          const filteredTasks = tasks.filter(t => 
                            t.projectId === selectedProjectId &&
                            (t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()))
                          );
                          if (filteredTasks.length === 0) {
                            return <p className="text-[10px] text-muted-foreground p-3 text-center">No tasks match search query in this project</p>;
                          }
                          return filteredTasks.map((t) => {
                            const isSelected = selectedTaskIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-start gap-2.5 p-2 hover:bg-secondary/40 cursor-pointer transition-colors select-none">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedTaskIds(selectedTaskIds.filter(id => id !== t.id));
                                    } else {
                                      setSelectedTaskIds([...selectedTaskIds, t.id]);
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] font-bold uppercase text-muted-foreground bg-secondary/80 px-1 py-0.2 rounded border border-border">
                                      {t.project?.name || 'No Project'}
                                    </span>
                                    {t.assignee && (
                                      <span className="text-[8px] font-medium text-amber-500 truncate max-w-[120px]">
                                        Assigned: {t.assignee}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 mt-2 text-center text-xs text-muted-foreground">
                      Please select a project first to assign tasks.
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 transition-all mt-6"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                <span>Edit Credentials</span>
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                    <option value="Security">Security</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {/* Project Assignment for Project Managers */}
              {role === 'PROJECT_MANAGER' && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">Select Project (Unassigned)</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project & Task Assignment for Employees */}
              {role === 'EMPLOYEE' && (
                <>
                  <div className="space-y-1.5 mt-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Project</label>
                    <select
                      required
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value)
                        setSelectedTaskIds([]) // Clear task assignments when switching projects
                      }}
                      className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3 text-xs outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="">Select Project (Required)</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProjectId ? (
                    <div className="space-y-1.5 mt-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assign Tasks ({selectedTaskIds.length} selected)</label>
                      <input
                        type="text"
                        placeholder="Search tasks by title..."
                        value={taskSearchTerm}
                        onChange={(e) => setTaskSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/50 py-2 px-3 text-xs outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                      />
                      <div className="border border-border rounded-xl bg-background/50 divide-y divide-border/60 max-h-36 overflow-y-auto">
                        {(() => {
                          const filteredTasks = tasks.filter(t => 
                            t.projectId === selectedProjectId &&
                            (t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()))
                          );
                          if (filteredTasks.length === 0) {
                            return <p className="text-[10px] text-muted-foreground p-3 text-center">No tasks match search query in this project</p>;
                          }
                          return filteredTasks.map((t) => {
                            const isSelected = selectedTaskIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-start gap-2.5 p-2 hover:bg-secondary/40 cursor-pointer transition-colors select-none">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedTaskIds(selectedTaskIds.filter(id => id !== t.id));
                                    } else {
                                      setSelectedTaskIds([...selectedTaskIds, t.id]);
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] font-bold uppercase text-muted-foreground bg-secondary/80 px-1 py-0.2 rounded border border-border">
                                      {t.project?.name || 'No Project'}
                                    </span>
                                    {t.assignee && (
                                      <span className={`text-[8px] font-medium truncate max-w-[120px] ${
                                        t.assignee === fullName ? 'text-primary font-bold' : 'text-amber-500'
                                      }`}>
                                        Assigned: {t.assignee === fullName ? 'This Employee' : t.assignee}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 mt-2 text-center text-xs text-muted-foreground">
                      Please select a project first to assign tasks.
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Account is Active and Enabled
                </label>
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
