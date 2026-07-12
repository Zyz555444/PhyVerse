import type { SandboxScene } from './sandboxStore'

const STORAGE_KEY = 'phyverse-sandbox-scene'

export function saveScene(scene: SandboxScene): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
}

export function loadStoredScene(): SandboxScene | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SandboxScene
    if (Array.isArray(parsed.items) && Array.isArray(parsed.gravity)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function exportScene(scene: SandboxScene): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phyverse-sandbox-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importScene(file: File): Promise<SandboxScene> {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid scene file')
  }
  const scene = parsed as Partial<SandboxScene>
  if (!Array.isArray(scene.items) || !Array.isArray(scene.gravity)) {
    throw new Error('Invalid scene structure')
  }
  return scene as SandboxScene
}
