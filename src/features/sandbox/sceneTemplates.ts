import type { SandboxScene } from './sandboxStore'

const TEMPLATES_KEY = 'phyverse-scene-templates'

export interface SceneTemplate {
  id: string
  name: string
  createdAt: number
  scene: SandboxScene
}

function generateId(): string {
  return `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadTemplates(): SceneTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t: unknown) =>
        t &&
        typeof t === 'object' &&
        typeof (t as SceneTemplate).id === 'string' &&
        typeof (t as SceneTemplate).name === 'string' &&
        typeof (t as SceneTemplate).createdAt === 'number' &&
        (t as SceneTemplate).scene != null
    ) as SceneTemplate[]
  } catch {
    return []
  }
}

function saveTemplates(templates: SceneTemplate[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function saveTemplate(name: string, scene: SandboxScene): SceneTemplate {
  const templates = loadTemplates()
  const template: SceneTemplate = {
    id: generateId(),
    name: name.trim() || `模板 ${templates.length + 1}`,
    createdAt: Date.now(),
    scene,
  }
  templates.push(template)
  saveTemplates(templates)
  return template
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates().filter((t) => t.id !== id)
  saveTemplates(templates)
}

export function renameTemplate(id: string, newName: string): SceneTemplate | null {
  const templates = loadTemplates()
  const template = templates.find((t) => t.id === id)
  if (!template) return null
  template.name = newName.trim() || template.name
  saveTemplates(templates)
  return template
}
