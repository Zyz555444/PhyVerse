import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureTables } from '../_lib/db.js'
import { getAuthUser } from '../_lib/auth.js'
import { handleCors } from '../_lib/cors.js'
import { aesDecrypt, KeyVersionMismatchError } from '../_lib/crypto.js'
import { assertSafeUpstreamUrl, UnsafeUrlError } from '../_lib/urlGuard.js'

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
    console.log('[ai/chat] step=ensureTables')
    await ensureTables()

    console.log('[ai/chat] step=selectConfig userId=%s', authUser.userId)
    const configResult = await sql`
      SELECT provider, endpoint, model, api_key_encrypted, api_key_iv, api_key_tag, key_version
      FROM ai_configs
      WHERE user_id = ${authUser.userId}
    `
    if (configResult.length === 0) {
      console.log('[ai/chat] step=configNotFound userId=%s', authUser.userId)
      res.status(404).json({ error: 'AI config not found. Please configure in settings first.' })
      return
    }

    const config = configResult[0]

    try {
      await assertSafeUpstreamUrl(config.endpoint)
    } catch (urlErr) {
      if (urlErr instanceof UnsafeUrlError) {
        console.error('[ai/chat] step=unsafeEndpoint error=%s', urlErr.message)
        res
          .status(400)
          .json({ error: 'Configured AI endpoint is not allowed. Please update it in settings.' })
        return
      }
      throw urlErr
    }

    console.log('[ai/chat] step=decryptApiKey provider=%s model=%s', config.provider, config.model)

    let apiKey: string
    try {
      apiKey = await aesDecrypt({
        encrypted: config.api_key_encrypted,
        iv: config.api_key_iv,
        tag: config.api_key_tag,
        keyVersion: config.key_version ?? 0,
      })
    } catch (decryptErr) {
      console.error('[ai/chat] step=decryptFailed error=%s', (decryptErr as Error).message)
      if (decryptErr instanceof KeyVersionMismatchError) {
        res.status(500).json({
          error: 'Encryption key has changed. Please reconfigure your AI provider in settings.',
        })
      } else {
        res.status(500).json({
          error: 'Failed to decrypt API key. Please reconfigure your AI provider in settings.',
        })
      }
      return
    }

    let actuallyStreaming = stream ?? true
    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages,
      stream: actuallyStreaming,
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

    console.log(
      '[ai/chat] step=callUpstream endpoint=%s model=%s stream=%s',
      config.endpoint,
      config.model,
      actuallyStreaming
    )
    let upstreamResponse = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!upstreamResponse.ok && requestBody.tools && actuallyStreaming) {
      const errorText = await upstreamResponse.text()
      const isJsonError = errorText.includes('Invalid JSON') || errorText.includes('tool call')
      if (isJsonError) {
        console.log('[ai/chat] step=retryNonStreaming reason=%s', errorText.slice(0, 200))
        actuallyStreaming = false
        requestBody.stream = false
        upstreamResponse = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        })
      } else {
        console.error(
          '[ai/chat] step=upstreamError status=%d body=%s',
          upstreamResponse.status,
          errorText.slice(0, 500)
        )
        res.status(upstreamResponse.status).json({ error: errorText || 'AI request failed' })
        return
      }
    }

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      console.error(
        '[ai/chat] step=upstreamError status=%d body=%s',
        upstreamResponse.status,
        errorText.slice(0, 500)
      )
      res.status(upstreamResponse.status).json({ error: errorText || 'AI request failed' })
      return
    }

    if (!upstreamResponse.body || !actuallyStreaming) {
      console.log('[ai/chat] step=returningJson')
      const data = await upstreamResponse.json()
      if (!actuallyStreaming) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        const message = data.choices?.[0]?.message
        if (message) {
          if (message.content) {
            res.write(
              `data: ${JSON.stringify({ choices: [{ delta: { content: message.content } }] })}\n\n`
            )
          }
          if (message.tool_calls) {
            for (let i = 0; i < message.tool_calls.length; i++) {
              const tc = message.tool_calls[i]
              res.write(
                `data: ${JSON.stringify({
                  choices: [
                    {
                      delta: {
                        tool_calls: [
                          {
                            index: i,
                            id: tc.id,
                            function: { name: tc.function.name, arguments: tc.function.arguments },
                          },
                        ],
                      },
                    },
                  ],
                })}\n\n`
              )
            }
          }
        }
        res.write('data: [DONE]\n\n')
        res.end()
        return
      }
      res.status(200).json(data)
      return
    }

    console.log('[ai/chat] step=streaming')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = upstreamResponse.body.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('[ai/chat] step=streamDone')
        break
      }
      res.write(Buffer.from(value))
    }

    res.end()
  } catch (error) {
    console.error(
      '[ai/chat] step=catch error=%s stack=%s',
      (error as Error).message,
      (error as Error).stack?.slice(0, 500)
    )
    res.status(500).json({ error: 'Internal server error' })
  }
}
