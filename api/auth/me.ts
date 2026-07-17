import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_lib/db.js'
import { getAuthUser } from '../_lib/auth.js'
import { handleCors } from '../_lib/cors.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authUser = getAuthUser(req)
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const result = await sql`
      SELECT id, email, display_name, avatar_url, created_at
      FROM users
      WHERE id = ${authUser.userId}
    `
    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result[0]
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
