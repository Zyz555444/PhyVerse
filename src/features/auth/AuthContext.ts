import { createContext, useContext } from 'react'
import type { User } from './authTypes'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
