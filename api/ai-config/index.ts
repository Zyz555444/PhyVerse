import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureTables } from '../_lib/db.js'
import { getAuthUser } from '../_lib/auth.js'
import { handleCors } from '../_lib/cors.js'
import { aesEncrypt } from '../_lib/crypto.js'

export interface AiConfigDto {
  id: string
  provider: string
  endpoint: string
  model: string
  createdAt: string
  updatedAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  const authUser = getAuthUser(req)
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  await ensureTables()

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT id, provider, endpoint, model, created_at, updated_at
        FROM ai_configs
        WHERE user_id = ${authUser.userId}
      `
      if (result.length === 0) {
        res.status(200).json({ config: null })
        return
      }
      const row = result[0]
      res.status(200).json({
        config: {
          id: row.id,
          provider: row.provider,
          endpoint: row.endpoint,
          model: row.model,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as AiConfigDto,
      })
    } catch (error) {
      console.error('Get AI config error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  if (req.method === 'POST') {
    const { provider, endpoint, model, apiKey } = req.body as {
      provider?: string
      endpoint?: string
      model?: string
      apiKey?: string
    }

    if (!provider || !endpoint || !model || !apiKey) {
      res.status(400).json({ error: 'provider, endpoint, model and apiKey are required' })
      return
    }

    try {
      const bundle = await aesEncrypt(apiKey)

      const existing = await sql`
        SELECT id FROM ai_configs WHERE user_id = ${authUser.userId}
      `

      let result
      if (existing.length > 0) {
        result = await sql`
          UPDATE ai_configs
          SET provider = ${provider},
              endpoint = ${endpoint},
              model = ${model},
              api_key_encrypted = ${bundle.encrypted},
              api_key_iv = ${bundle.iv},
              api_key_tag = ${bundle.tag},
              key_version = ${bundle.keyVersion},
              updated_at = NOW()
          WHERE user_id = ${authUser.userId}
          RETURNING id, provider, endpoint, model, created_at, updated_at
        `
      } else {
        result = await sql`
          INSERT INTO ai_configs (user_id, provider, endpoint, model, api_key_encrypted, api_key_iv, api_key_tag, key_version)
          VALUES (
            ${authUser.userId},
            ${provider},
            ${endpoint},
            ${model},
            ${bundle.encrypted},
            ${bundle.iv},
            ${bundle.tag},
            ${bundle.keyVersion}
          )
          RETURNING id, provider, endpoint, model, created_at, updated_at
        `
      }

      const row = result[0]
      res.status(200).json({
        config: {
          id: row.id,
          provider: row.provider,
          endpoint: row.endpoint,
          model: row.model,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as AiConfigDto,
      })
    } catch (error) {
      console.error('Save AI config error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM ai_configs WHERE user_id = ${authUser.userId}`
      res.status(204).end()
    } catch (error) {
      console.error('Delete AI config error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
