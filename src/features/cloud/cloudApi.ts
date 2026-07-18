import type { SceneMetadata, CloudScene } from '@/features/auth/authTypes'
import { apiRequest } from '@/shared/utils/apiClient'

export async function listScenes(): Promise<{ scenes: SceneMetadata[] }> {
  return apiRequest<{ scenes: SceneMetadata[] }>('/scenes')
}

export async function getScene(id: string): Promise<{ scene: CloudScene }> {
  return apiRequest<{ scene: CloudScene }>(`/scenes/${id}`)
}

export async function saveScene(payload: {
  name: string
  description?: string
  data: unknown
  isPublic?: boolean
}): Promise<{ scene: SceneMetadata }> {
  return apiRequest<{ scene: SceneMetadata }>('/scenes', {
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
  return apiRequest<{ scene: SceneMetadata }>(`/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteScene(id: string): Promise<void> {
  await apiRequest<void>(`/scenes/${id}`, {
    method: 'DELETE',
  })
}
