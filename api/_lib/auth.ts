import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { VercelRequest } from '@vercel/node'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export const SALT_ROUNDS = 10
export const TOKEN_EXPIRES_IN = '7d'

export interface TokenPayload {
  userId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN, algorithm: 'HS256' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload
}

export function getAuthUser(req: VercelRequest): TokenPayload | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}
