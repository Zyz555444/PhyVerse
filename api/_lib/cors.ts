import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
]

// Additional production origins can be supplied via the CORS_ALLOWED_ORIGINS
// environment variable as a comma-separated list.
function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return [...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin
  const allowedOrigins = getAllowedOrigins()

  // Only reflect the Origin when it is explicitly allow-listed. We never fall
  // back to `*`, because combining a wildcard (or a reflected arbitrary origin)
  // with `Access-Control-Allow-Credentials: true` would let any site issue
  // authenticated cross-origin requests on behalf of a logged-in user.
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
