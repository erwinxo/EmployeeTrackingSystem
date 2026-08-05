import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'

export function DashboardLayout() {
  const { user, isLoading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Synchronizing workspace session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollTop, setLastScrollTop] = useState(0)

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    // Hide navbar when scrolling down, show when scrolling up
    if (scrollTop > lastScrollTop && scrollTop > 80) {
      setNavVisible(false)
    } else {
      setNavVisible(true)
    }
    setLastScrollTop(scrollTop)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content Area */}
        <main
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-accent/20 p-4 md:p-6"
        >
          <div className="mx-auto max-w-7xl relative space-y-6">
            {/* Glassmorphic Floating Navbar */}
            <Navbar visible={navVisible} setMobileOpen={setMobileOpen} />
            <div className="pt-2">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
