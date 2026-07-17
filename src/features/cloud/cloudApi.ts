import type { SceneMetadata, CloudScene } from '@/features/auth/authTypes'

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

export async function listScenes(): Promise<{ scenes: SceneMetadata[] }> {
  return request<{ scenes: SceneMetadata[] }>('/scenes')
}

export async function getScene(id: string): Promise<{ scene: CloudScene }> {
  return request<{ scene: CloudScene }>(`/scenes/${id}`)
}

export async function saveScene(payload: {
  name: string
  description?: string
  data: unknown
  isPublic?: boolean
}): Promise<{ scene: SceneMetadata }> {
  return request<{ scene: SceneMetadata }>('/scenes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateScene(
  id: string,
  payload: {
    name?: string
    description?: string
    data?: unknown
    isPublic?: boolean
  }
): Promise<{ scene: SceneMetadata }> {
  return request<{ scene: SceneMetadata }>(`/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteScene(id: string): Promise<void> {
  await request<void>(`/scenes/${id}`, {
    method: 'DELETE',
  })
}
