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
import Chat from '../pages/Chat'
import NotFound from '../pages/NotFound'
import SuperAdminLogin from '../pages/SuperAdminLogin'
import SuperAdminDashboard from '../pages/SuperAdminDashboard'
import { useAuth, useSystemSettings } from '../hooks'
import type { UserRole } from '../types'
import { toast } from 'sonner'

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

interface FeatureGuardProps {
  children: React.ReactNode
  featureKey: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS'
}

function FeatureGuard({ children, featureKey }: FeatureGuardProps) {
  const { isFeatureEnabled } = useSystemSettings()

  if (!isFeatureEnabled(featureKey)) {
    const label =
      featureKey === 'FEATURE_CHAT' ? 'Messaging' :
      featureKey === 'FEATURE_REPORTS' ? 'Reports' :
      'Tasks';

    setTimeout(() => {
      toast.error(`The ${label} module has been temporarily disabled by an administrator.`);
    }, 0);

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
    path: '/superadmin/login',
    element: <SuperAdminLogin />,
  },
  {
    path: '/superadmin/dashboard',
    element: <SuperAdminDashboard />,
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
        element: (
          <FeatureGuard featureKey="FEATURE_TASKS">
            <Tasks />
          </FeatureGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <FeatureGuard featureKey="FEATURE_REPORTS">
            <Reports />
          </FeatureGuard>
        ),
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'chat',
        element: (
          <FeatureGuard featureKey="FEATURE_CHAT">
            <Chat />
          </FeatureGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
