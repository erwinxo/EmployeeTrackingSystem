// Comprehensive TypeScript Types & Interfaces for Employee Tracking System

export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'MANAGER' | 'EMPLOYEE'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  department?: string
  managerId?: string
  createdAt?: string
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'FINISHED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  projectId?: string
  project?: string
  assignedTo?: string
  employee?: string
  avatar?: string
  requirementId?: string
  requirement?: string
  createdAt?: string
  updatedAt?: string
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Active' | 'Finishing' | 'Completed' | 'On Hold'

export interface Project {
  id: string
  name: string
  description?: string
  progress: number
  tasksCount: number
  client: string
  status: ProjectStatus
  managerId?: string
  managerName?: string
  createdAt?: string
  updatedAt?: string
}

export type RequirementStatus = 'DRAFT' | 'APPROVED' | 'IN_DEV' | 'TESTING' | 'DEPLOYED'

export interface Requirement {
  id: string
  code: string // e.g. "FR-09"
  title: string
  description?: string
  projectId: string
  projectName?: string
  status: RequirementStatus
  priority: TaskPriority
  loggedBy: string
  createdAt?: string
}

export interface ActivityLog {
  id: string
  user: string
  avatar?: string
  action: string
  target: string
  timestamp: string
  type?: 'task' | 'project' | 'auth' | 'system'
}

export interface TimeTrackerDay {
  day: string
  work: number
  breaks: number
  lunch: number
}

export interface TimeTrackerWeek {
  weekRange: string
  days: TimeTrackerDay[]
}

export interface Report {
  id: string
  title: string
  type: 'time' | 'project' | 'employee' | 'requirement'
  format: 'PDF' | 'XLSX' | 'CSV'
  generatedAt: string
  size: string
  downloadUrl?: string
}

// API Service Interfaces
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  totalItems: number
  currentPage: number
  totalPages: number
  pageSize: number
}

export interface AuthResponse {
  token: string
  user: User
}
