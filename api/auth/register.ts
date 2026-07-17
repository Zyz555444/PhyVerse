import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureTables } from '../_lib/db'
import { hashPassword, signToken } from '../_lib/auth'
import { handleCors } from '../_lib/cors'

interface RegisterBody {
  email?: string
  password?: string
  displayName?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password, displayName } = (req.body ?? {}) as RegisterBody

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  try {
    await ensureTables()

    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO users (email, password_hash, display_name)
      VALUES (${normalizedEmail}, ${passwordHash}, ${displayName?.trim() ?? null})
      RETURNING id, email, display_name
    `
    const user = result[0]
    const token = signToken({ userId: user.id, email: user.email })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
