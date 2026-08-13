import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import api from '../services/api'
import { Users, Building2, ShieldCheck, Search, Plus, Trash2, Edit2, UserPlus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { User, UserRole } from '../types'

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
]

interface DbUserExtended extends User {
  isActive: boolean
}

export default function Employees() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'

  const [employees, setEmployees] = useState<DbUserExtended[]>([])
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
      }))
      setEmployees(mapped)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to load employee list from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('EMPLOYEE')
    setDepartment('Engineering')
    setIsActive(true)
    setEditingId(null)
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
      })
      toast.success('Employee created successfully')
      setIsAddModalOpen(false)
      fetchEmployees()
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
      })
      toast.success('Employee updated successfully')
      setIsEditModalOpen(false)
      fetchEmployees()
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
                  <img src={emp.avatar} alt={emp.name} className="h-10 w-10 rounded-full object-cover border border-border" />
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
                    emp.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
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

              <div className="flex items-center gap-2 mt-2">
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
