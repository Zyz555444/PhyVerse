import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import type { User } from './authTypes'
import { login as loginApi, register as registerApi, fetchCurrentUser } from './authApi'
import { TOKEN_KEY, getStoredToken } from '@/shared/utils/apiClient'

const USER_KEY = 'phyverse-user'

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const storedToken = getStoredToken()
    if (!storedToken) return

    let cancelled = false
    setIsLoading(true)
    fetchCurrentUser()
      .then(({ user: currentUser }) => {
        if (cancelled) return
        setUser(currentUser)
        window.localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        if (cancelled) return
        window.localStorage.removeItem(TOKEN_KEY)
        window.localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const persistAuth = useCallback((authToken: string, authUser: User) => {
    window.localStorage.setItem(TOKEN_KEY, authToken)
    window.localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await loginApi({ email, password })
        persistAuth(response.token, response.user)
        setIsOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [persistAuth]
  )

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await registerApi({ email, password, displayName })
        persistAuth(response.token, response.user)
        setIsOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [persistAuth]
  )

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      error,
      isOpen,
      setIsOpen,
      login,
      register,
      logout,
      clearError,
    }),
    [user, token, isLoading, error, isOpen, login, register, logout, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
