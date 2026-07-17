import type { AiConfig } from './aiConfigTypes'

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

export async function fetchAiConfig(): Promise<{ config: AiConfig | null }> {
  return request<{ config: AiConfig | null }>('/ai-config')
}

export async function saveAiConfig(payload: {
  provider: string
  endpoint: string
  model: string
  apiKey: string
}): Promise<{ config: AiConfig }> {
  return request<{ config: AiConfig }>('/ai-config', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteAiConfig(): Promise<void> {
  await request<void>('/ai-config', {
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
  const token = localStorage.getItem('phyverse-token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}
