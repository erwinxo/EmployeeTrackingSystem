import { useAuth, useTheme } from '../hooks'
import { Menu, Sun, Moon, Laptop } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { cn } from '../utils'

interface NavbarProps {
  visible: boolean
  setMobileOpen: (open: boolean) => void
}

export function Navbar({ visible, setMobileOpen }: NavbarProps) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  if (!user) return null

  const getBreadcrumbs = () => {
    const path = location.pathname.substring(1)
    if (!path) return 'Dashboard'
    // Capitalize first letter and replace slashes
    return path
      .split('/')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' / ')
  }

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border border-border bg-card/85 backdrop-blur-md px-6 rounded-2xl sticky top-2 z-30 transition-all duration-300 shadow-md",
        visible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs hidden sm:inline">Workspace</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">/</span>
          <span className="font-semibold text-foreground text-sm tracking-wide">{getBreadcrumbs()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Toggle */}
        <div className="flex items-center rounded-xl bg-accent/30 p-1 border border-border">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Light Mode"
          >
            <Sun size={15} />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dark Mode"
          >
            <Moon size={15} />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'system'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="System Theme"
          >
            <Laptop size={15} />
          </button>
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover border border-border"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-foreground leading-none">{user.name}</p>
            <span className="text-[9px] text-muted-foreground mt-0.5 block capitalize">{user.role.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
