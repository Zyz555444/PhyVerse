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

  const { id } = req.query as { id: string }
  if (!id) {
    res.status(400).json({ error: 'Scene id is required' })
    return
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT id, name, description, data, is_public, created_at, updated_at
        FROM scenes
        WHERE id = ${id} AND user_id = ${authUser.userId}
      `
      if (result.length === 0) {
        res.status(404).json({ error: 'Scene not found' })
        return
      }
      const scene = result[0]
      res.status(200).json({
        scene: {
          id: scene.id,
          name: scene.name,
          description: scene.description,
          data: scene.data,
          isPublic: scene.is_public,
          createdAt: scene.created_at,
          updatedAt: scene.updated_at,
        },
      })
    } catch (error) {
      console.error('Get scene error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { name, description, data, isPublic } = req.body as {
      name?: string
      description?: string
      data?: unknown
      isPublic?: boolean
    }

    try {
      const updates: string[] = []
      const values: unknown[] = []
      let paramIndex = 1

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        values.push(name.trim())
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`)
        values.push(description.trim())
      }
      if (data !== undefined) {
        updates.push(`data = $${paramIndex++}`)
        values.push(JSON.stringify(data))
      }
      if (isPublic !== undefined) {
        updates.push(`is_public = $${paramIndex++}`)
        values.push(isPublic)
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' })
        return
      }

      updates.push(`updated_at = NOW()`)
      values.push(id)
      values.push(authUser.userId)

      const result = await sql.query(
        `UPDATE scenes SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING id, name, description, is_public, created_at, updated_at`,
        values
      )

      if (result.length === 0) {
        res.status(404).json({ error: 'Scene not found' })
        return
      }

      const scene = result[0]
      res.status(200).json({
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
      console.error('Update scene error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`
        DELETE FROM scenes
        WHERE id = ${id} AND user_id = ${authUser.userId}
        RETURNING id
      `
      if (result.length === 0) {
        res.status(404).json({ error: 'Scene not found' })
        return
      }
      res.status(204).end()
    } catch (error) {
      console.error('Delete scene error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
