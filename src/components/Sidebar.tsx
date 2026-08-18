import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'
import {
  LayoutDashboard,
  Users,
  FolderGit2,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react'
import { cn } from '../utils'

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  // Define navigation items based on user role
  const allNavItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'],
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'],
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: FolderGit2,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'],
    },
    {
      name: 'Requirements',
      path: '/requirements',
      icon: ClipboardList,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'],
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: CheckSquare,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'],
    },
  ]

  const navItems = allNavItems.filter((item) => item.roles.includes(user.role))

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-card/85 text-card-foreground border border-border md:rounded-3xl transition-all duration-300 shadow-xl backdrop-blur-md">
      <div>
        {/* Logo Section */}
        <div className={cn(
          "flex h-16 items-center border-b border-border transition-all duration-300",
          collapsed ? "justify-center px-0" : "justify-between px-6"
        )}>
          <div className="flex items-center gap-2">
            <img
              src="/Logo1.png"
              alt="EmpTracker Logo"
              className="h-9 w-9 object-contain shrink-0"
            />
            {!collapsed && (
              <span className="font-semibold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                EmpTracker
              </span>
            )}
          </div>
          {/* Close button for mobile */}
          {!collapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 rounded-md hover:bg-accent text-muted-foreground"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={cn("space-y-1.5 py-6 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200 group relative',
                  collapsed ? 'justify-center px-0' : 'px-4',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-4 z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Info & Toggle Section */}
      <div className={cn("border-t border-border transition-all duration-300", collapsed ? "p-2" : "p-4")}>
        {/* User Card */}
        {!collapsed && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-accent/40 p-3">
            <img
              src={user.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238696a0'><rect width='24' height='24' fill='%23e9edef'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover border border-border"
            />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium leading-none">{user.name}</p>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-1 block">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {/* Logout Button */}
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors',
              collapsed ? 'justify-center px-0' : 'px-4'
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground mt-2 self-center transition-transform"
          >
            <ChevronLeft
              size={20}
              className={cn('transition-transform duration-300', collapsed ? 'rotate-180' : '')}
            />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block h-[calc(100vh-2rem)] sticky top-4 z-40 shrink-0 transition-all duration-300 my-4 ml-4',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-45 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
