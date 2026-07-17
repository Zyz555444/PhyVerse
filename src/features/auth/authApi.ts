import type { AuthResponse, RegisterData, AuthCredentials, User } from './authTypes'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('phyverse-token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`)
  }

  return data as T
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  return request<{ user: User }>('/auth/me')
}
