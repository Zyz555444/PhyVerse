import dns from 'dns/promises'
import net from 'net'

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeUrlError'
  }
}

function ipToParts(ip: string): number[] | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums
}

// Returns true for loopback, private, link-local, and other non-routable ranges
// (IPv4 and IPv6) that must not be reachable from a server-side fetch.
export function isPrivateAddress(address: string): boolean {
  const family = net.isIP(address)

  if (family === 4) {
    const p = ipToParts(address)
    if (!p) return true
    const [a, b] = p
    if (a === 0) return true // "this" network
    if (a === 10) return true // 10.0.0.0/8
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local (incl. cloud metadata 169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
    if (a === 192 && b === 168) return true // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT 100.64.0.0/10
    if (a >= 224) return true // multicast / reserved
    return false
  }

  if (family === 6) {
    const addr = address.toLowerCase()
    if (addr === '::1' || addr === '::') return true // loopback / unspecified
    if (addr.startsWith('fe80')) return true // link-local
    if (addr.startsWith('fc') || addr.startsWith('fd')) return true // unique local fc00::/7
    // IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254)
    const mapped = addr.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }

  // Not a bare IP literal — caller must resolve DNS first.
  return false
}

// Validates an outbound URL and resolves its host to ensure it does not point at
// an internal/private address, mitigating SSRF. Only http(s) is permitted.
export async function assertSafeUpstreamUrl(rawUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UnsafeUrlError('Endpoint must be a valid absolute URL')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new UnsafeUrlError('Endpoint must use http or https')
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  if (hostname.toLowerCase() === 'localhost') {
    throw new UnsafeUrlError('Endpoint host is not allowed')
  }

  // If the host is a literal IP, check it directly.
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new UnsafeUrlError('Endpoint host resolves to a private address')
    }
    return
  }

  // Otherwise resolve DNS and verify every returned address is public. This also
  // defends against DNS entries that point at internal infrastructure.
  let resolved: { address: string }[]
  try {
    resolved = await dns.lookup(hostname, { all: true })
  } catch {
    throw new UnsafeUrlError('Endpoint host could not be resolved')
  }

  if (resolved.length === 0 || resolved.some((r) => isPrivateAddress(r.address))) {
    throw new UnsafeUrlError('Endpoint host resolves to a private address')
  }
}
