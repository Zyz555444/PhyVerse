import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureTables } from '../_lib/db'
import { verifyPassword, signToken } from '../_lib/auth'
import { handleCors } from '../_lib/cors'

interface LoginBody {
  email?: string
  password?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password } = (req.body ?? {}) as LoginBody

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    await ensureTables()

    const result = await sql`
      SELECT id, email, password_hash, display_name
      FROM users
      WHERE email = ${normalizedEmail}
    `
    if (result.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const user = result[0]
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = signToken({ userId: user.id, email: user.email })

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
