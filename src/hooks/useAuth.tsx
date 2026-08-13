import { createContext, useContext, useState } from 'react'
import type { User, UserRole } from '../types'
import api from '../services/api'
import { STORAGE_KEYS } from '../constants'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user: dbUser, token } = response.data.data

      const frontendUser: User = {
        id: dbUser.id,
        name: dbUser.fullName || dbUser.name || 'Anonymous User',
        email: dbUser.email,
        role: (dbUser.role || 'EMPLOYEE').toUpperCase() as UserRole,
      }

      setUser(frontendUser)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(frontendUser))
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
