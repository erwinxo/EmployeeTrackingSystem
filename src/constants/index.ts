// Application Constants & Enumeration Lists

export const STORAGE_KEYS = {
  TOKEN: 'ets_auth_token',
  USER: 'ets_auth_user',
  THEME: 'ets_theme_preference',
} as const

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const

export const TASK_STATUS_LIST = [
  { value: 'TODO', label: 'To Do', color: 'bg-muted text-muted-foreground border-border/40' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  { value: 'REVIEW', label: 'In Review', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'FINISHED', label: 'Finished', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
] as const

export const TASK_PRIORITY_LIST = [
  { value: 'HIGH', label: 'High Priority', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20' },
  { value: 'LOW', label: 'Low Priority', color: 'bg-muted text-muted-foreground border-border/40' },
] as const

export const PROJECT_STATUS_LIST = [
  'Planning',
  'In Progress',
  'Active',
  'Finishing',
  'Completed',
  'On Hold',
] as const

export const REQUIREMENT_STATUS_LIST = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_DEV', label: 'In Development' },
  { value: 'TESTING', label: 'In Testing' },
  { value: 'DEPLOYED', label: 'Deployed' },
] as const

export const APP_CONFIG = {
  TITLE: 'Employee Tracking System',
  VERSION: '1.0.0',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://employeetrackingsystem-ymsp.onrender.com/api/v1',
  MAX_PAGE_SIZE: 10,
} as const
