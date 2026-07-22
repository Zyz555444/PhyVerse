const CACHE_NAME = 'phyverse-v2'
const PRECACHE_URLS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

// Static asset patterns (Cache-First)
const STATIC_PATTERNS = [/\.(js|css|woff2?|png|jpg|svg|ico|webp)$/i, /\/assets\//]

// API patterns (Network-First)
const API_PATTERNS = [/\/api\//]

// WASM patterns (Cache-First with long TTL)
const WASM_PATTERNS = [/\.wasm$/i]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  )
  self.clients.claim()
})

function matchesAny(url, patterns) {
  return patterns.some((p) => p.test(url))
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = event.request.url

  // API requests: Network-First, fallback to cache
  if (matchesAny(url, API_PATTERNS)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets and WASM: Cache-First
  if (matchesAny(url, STATIC_PATTERNS) || matchesAny(url, WASM_PATTERNS)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          return response
        })
      })
    )
    return
  }

  // Default: Cache-First for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).catch(() => cached)
    })
  )
})
