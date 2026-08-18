/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Employees from '../pages/Employees'
import Projects from '../pages/Projects'
import Requirements from '../pages/Requirements'
import Tasks from '../pages/Tasks'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'
import { useAuth } from '../hooks'
import type { UserRole } from '../types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    errorElement: <NotFound />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'employees',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'PROJECT_MANAGER']}>
            <Employees />
          </RoleGuard>
        ),
      },
      {
        path: 'projects',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'PROJECT_MANAGER']}>
            <Projects />
          </RoleGuard>
        ),
      },
      {
        path: 'requirements',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'PROJECT_MANAGER']}>
            <Requirements />
          </RoleGuard>
        ),
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
