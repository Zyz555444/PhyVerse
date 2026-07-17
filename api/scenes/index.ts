import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_lib/db'
import { getAuthUser } from '../_lib/auth'
import { handleCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  const authUser = getAuthUser(req)
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT id, name, description, is_public, created_at, updated_at
        FROM scenes
        WHERE user_id = ${authUser.userId}
        ORDER BY updated_at DESC
      `
      res.status(200).json({
        scenes: rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          isPublic: row.is_public,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      })
    } catch (error) {
      console.error('List scenes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  if (req.method === 'POST') {
    const { name, description, data, isPublic } = req.body as {
      name?: string
      description?: string
      data?: unknown
      isPublic?: boolean
    }

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Scene name is required' })
      return
    }

    try {
      const result = await sql`
        INSERT INTO scenes (user_id, name, description, data, is_public)
        VALUES (
          ${authUser.userId},
          ${name.trim()},
          ${description?.trim() ?? null},
          ${JSON.stringify(data ?? {})},
          ${isPublic ?? false}
        )
        RETURNING id, name, description, is_public, created_at, updated_at
      `
      const scene = result[0]
      res.status(201).json({
        scene: {
          id: scene.id,
          name: scene.name,
          description: scene.description,
          isPublic: scene.is_public,
          createdAt: scene.created_at,
          updatedAt: scene.updated_at,
        },
      })
    } catch (error) {
      console.error('Create scene error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
