export interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl?: string | null
  createdAt?: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterData extends AuthCredentials {
  displayName?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface SceneMetadata {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CloudScene {
  id: string
  name: string
  description: string | null
  data: unknown
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
