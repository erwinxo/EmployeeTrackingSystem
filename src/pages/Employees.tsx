import { useState } from 'react'
import type { User } from '../types'

const LOCAL_STORAGE_KEY = 'ets_employees'

const INITIAL_EMPLOYEES: User[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 'admin@company.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    department: 'Management',
  },
  {
    id: '2',
    name: 'Marcus Wright',
    email: 'manager@company.com',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Operations',
    managerId: '1',
  },
  {
    id: '3',
    name: 'John Connor',
    email: 'employee@company.com',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    department: 'Engineering',
    managerId: '2',
  },
  {
    id: '4',
    name: 'Elena Rostova',
    email: 'pm@company.com',
    role: 'PROJECT_MANAGER',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    department: 'Product',
    managerId: '1',
  },
  {
    id: '5',
    name: 'Kyle Reese',
    email: 'kyle.reese@company.com',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    department: 'Engineering',
    managerId: '2',
  },
  {
    id: '6',
    name: 'T-800',
    email: 't800@company.com',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    department: 'Security',
    managerId: '2',
  },
  {
    id: '7',
    name: 'T-1000',
    email: 't1000@company.com',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    department: 'Security',
    managerId: '2',
  },
]

export default function Employees() {
  const [employees, setEmployees] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved) as User[]
      } catch {
        return INITIAL_EMPLOYEES
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES))
    return INITIAL_EMPLOYEES
  })

  const addEmployee = (newEmp: Omit<User, 'id'>) => {
    const nextId = (Math.max(...employees.map((e) => parseInt(e.id) || 0), 0) + 1).toString()
    const employeeWithId: User = { ...newEmp, id: nextId }
    const updated = [...employees, employeeWithId]
    setEmployees(updated)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  }

  const editEmployee = (updatedEmp: User) => {
    const updated = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    setEmployees(updated)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  }

  const deleteEmployee = (id: string) => {
    const updated = employees.filter((e) => e.id !== id)
    setEmployees(updated)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  }

  // Prevent warnings on unused CRUD helpers temporarily during steps
  console.debug('CRUD helpers initialized:', { addEmployee, editEmployee, deleteEmployee })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage system users, employee profiles, roles, and supervisor mapping.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2 font-bold">Local Mock Database Initialized</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Currently tracking {employees.length} active employee profiles in local storage.
        </p>
      </div>
    </div>
  )
}
