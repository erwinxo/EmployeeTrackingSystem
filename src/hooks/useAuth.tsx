/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import type { User, UserRole } from '../types'

interface AuthContextType {
  user: User | null
  login: (email: string, role: UserRole) => Promise<void>
  logout: () => void
  switchRole: (role: UserRole) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_USERS: Record<UserRole, User> = {
  ADMIN: {
    id: '1',
    name: 'Sarah Connor',
    email: 'admin@company.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  PROJECT_MANAGER: {
    id: '4',
    name: 'Elena Rostova',
    email: 'pm@company.com',
    role: 'PROJECT_MANAGER',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  MANAGER: {
    id: '2',
    name: 'Marcus Wright',
    email: 'manager@company.com',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  EMPLOYEE: {
    id: '3',
    name: 'John Connor',
    email: 'employee@company.com',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User
      } catch {
        return null
      }
    }
    // Default auto-login to Admin for Day 1 convenience
    const defaultUser = MOCK_USERS.ADMIN
    localStorage.setItem('user', JSON.stringify(defaultUser))
    localStorage.setItem('token', 'mock-jwt-token')
    return defaultUser
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, role: UserRole) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const selectedUser = MOCK_USERS[role]
    const userWithEmail = { ...selectedUser, email }
    setUser(userWithEmail)
    localStorage.setItem('user', JSON.stringify(userWithEmail))
    localStorage.setItem('token', 'mock-jwt-token')
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const switchRole = (role: UserRole) => {
    const newUser = MOCK_USERS[role]
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
