import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

// Suppress known harmless deprecation warnings from @react-three/fiber internals
// until the library migrates from THREE.Clock/PCFSoftShadowMap.
const IGNORED_WARNINGS = [
  'THREE.Clock: This module has been deprecated',
  'THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated',
]
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (args.length > 0 && typeof args[0] === 'string') {
    const message = args[0]
    if (IGNORED_WARNINGS.some((prefix) => message.includes(prefix))) {
      return
    }
  }
  originalWarn.apply(console, args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail in environments where SW registration is blocked.
    })
  })
}
