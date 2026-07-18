import type { AuthResponse, RegisterData, AuthCredentials, User } from './authTypes'
import { apiRequest } from '@/shared/utils/apiClient'

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me')
}
