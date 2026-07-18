import type { AiConfig } from './aiConfigTypes'
import { API_BASE, apiRequest, buildAuthHeaders } from '@/shared/utils/apiClient'

export async function fetchAiConfig(): Promise<{ config: AiConfig | null }> {
  return apiRequest<{ config: AiConfig | null }>('/ai-config')
}

export async function saveAiConfig(payload: {
  provider: string
  endpoint: string
  model: string
  apiKey: string
}): Promise<{ config: AiConfig }> {
  return apiRequest<{ config: AiConfig }>('/ai-config', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAiConfig(): Promise<void> {
  await apiRequest<void>('/ai-config', {
    method: 'DELETE',
  })
}

export async function sendAiChat(payload: {
  messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[]
  tools?: unknown[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}): Promise<Response> {
  return fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  })
}
