import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_lib/db'
import { getAuthUser } from '../_lib/auth'
import { handleCors } from '../_lib/cors'
import { aesDecrypt } from '../_lib/crypto'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
  tool_calls?: unknown[]
}

interface ChatRequestBody {
  messages?: ChatMessage[]
  tools?: unknown[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  const authUser = getAuthUser(req)
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { messages, tools, stream, temperature, max_tokens } = (req.body ?? {}) as ChatRequestBody

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  try {
    const configResult = await sql`
      SELECT provider, endpoint, model, api_key_encrypted, api_key_iv, api_key_tag
      FROM ai_configs
      WHERE user_id = ${authUser.userId}
    `
    if (configResult.length === 0) {
      res.status(404).json({ error: 'AI config not found. Please configure in settings first.' })
      return
    }

    const config = configResult[0]
    const apiKey = aesDecrypt({
      encrypted: config.api_key_encrypted,
      iv: config.api_key_iv,
      tag: config.api_key_tag,
    })

    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages,
      stream: stream ?? true,
    }
    if (tools && tools.length > 0) {
      requestBody.tools = tools
    }
    if (temperature !== undefined) {
      requestBody.temperature = temperature
    }
    if (max_tokens !== undefined) {
      requestBody.max_tokens = max_tokens
    }

    const upstreamResponse = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      res.status(upstreamResponse.status).json({ error: errorText || 'AI request failed' })
      return
    }

    if (!upstreamResponse.body || !stream) {
      const data = await upstreamResponse.json()
      res.status(200).json(data)
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = upstreamResponse.body.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }

    res.end()
  } catch (error) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
