export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const TOKEN_KEY = 'phyverse-token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function buildAuthHeaders(base: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...base,
  }
  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildAuthHeaders((options.headers as Record<string, string>) ?? {}),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`)
  }

  return data as T
}
