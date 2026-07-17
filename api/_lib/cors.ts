import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean)

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
