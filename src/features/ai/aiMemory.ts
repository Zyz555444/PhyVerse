export interface MemoryEntry {
  id: string
  timestamp: number
  type: 'conversation' | 'scene_state' | 'user_preference' | 'experiment_pattern' | 'error_pattern'
  data: unknown
}

export interface ConversationMemory {
  userId: string
  sessionId: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  sceneSnapshots: Array<{ timestamp: number; itemCount: number; gravity: [number, number, number] }>
  userPreferences: {
    preferredTools: string[]
    commonTopics: string[]
    language: string
  }
  experimentPatterns: Array<{
    description: string
    successRate: number
    lastUsed: number
  }>
  errorPatterns: Array<{
    error: string
    frequency: number
    lastOccurrence: number
    suggestedFix: string
  }>
}

const MEMORY_STORAGE_KEY = 'phyverse-ai-memory'
const MAX_MEMORY_ENTRIES = 100

class AiMemorySystem {
  private memory: Map<string, ConversationMemory> = new Map()
  private loaded = false

  loadFromStorage(): void {
    if (this.loaded) return
    
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY)
      if (!raw) {
        this.loaded = true
        return
      }
      
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([key, value]) => {
          this.memory.set(key, value as ConversationMemory)
        })
      }
    } catch (err) {
      console.error('[AiMemory] Failed to load memory:', err)
    }
    
    this.loaded = true
  }

  saveToStorage(): void {
    try {
      const obj = Object.fromEntries(this.memory)
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(obj))
    } catch (err) {
      console.error('[AiMemory] Failed to save memory:', err)
    }
  }

  getOrCreateMemory(userId: string, sessionId: string): ConversationMemory {
    this.loadFromStorage()
    
    const key = `${userId}:${sessionId}`
    let memory = this.memory.get(key)
    
    if (!memory) {
      memory = {
        userId,
        sessionId,
        messages: [],
        sceneSnapshots: [],
        userPreferences: {
          preferredTools: [],
          commonTopics: [],
          language: 'zh',
        },
        experimentPatterns: [],
        errorPatterns: [],
      }
      this.memory.set(key, memory)
    }
    
    return memory
  }

  addMessage(userId: string, sessionId: string, role: string, content: string): void {
    const memory = this.getOrCreateMemory(userId, sessionId)
    memory.messages.push({
      role,
      content,
      timestamp: Date.now(),
    })
    
    // Keep only recent messages
    if (memory.messages.length > MAX_MEMORY_ENTRIES) {
      memory.messages = memory.messages.slice(-MAX_MEMORY_ENTRIES)
    }
    
    this.saveToStorage()
  }

  addSceneSnapshot(
    userId: string,
    sessionId: string,
    itemCount: number,
    gravity: [number, number, number]
  ): void {
    const memory = this.getOrCreateMemory(userId, sessionId)
    memory.sceneSnapshots.push({
      timestamp: Date.now(),
      itemCount,
      gravity,
    })
    
    // Keep only recent snapshots
    if (memory.sceneSnapshots.length > 50) {
      memory.sceneSnapshots = memory.sceneSnapshots.slice(-50)
    }
    
    this.saveToStorage()
  }

  recordToolUsage(userId: string, sessionId: string, toolName: string): void {
    const memory = this.getOrCreateMemory(userId, sessionId)
    const prefs = memory.userPreferences
    
    if (!prefs.preferredTools.includes(toolName)) {
      prefs.preferredTools.push(toolName)
    }
    
    // Update frequency (move to end)
    const index = prefs.preferredTools.indexOf(toolName)
    if (index > -1) {
      prefs.preferredTools.splice(index, 1)
      prefs.preferredTools.push(toolName)
    }
    
    // Keep only top 10
    if (prefs.preferredTools.length > 10) {
      prefs.preferredTools = prefs.preferredTools.slice(-10)
    }
    
    this.saveToStorage()
  }

  recordExperimentSuccess(
    userId: string,
    sessionId: string,
    description: string,
    success: boolean
  ): void {
    const memory = this.getOrCreateMemory(userId, sessionId)
    const existing = memory.experimentPatterns.find(p => p.description === description)
    
    if (existing) {
      existing.lastUsed = Date.now()
      existing.successRate = existing.successRate * 0.9 + (success ? 1 : 0) * 0.1
    } else {
      memory.experimentPatterns.push({
        description,
        successRate: success ? 1 : 0,
        lastUsed: Date.now(),
      })
    }
    
    this.saveToStorage()
  }

  recordError(
    userId: string,
    sessionId: string,
    error: string,
    suggestedFix?: string
  ): void {
    const memory = this.getOrCreateMemory(userId, sessionId)
    const existing = memory.errorPatterns.find(e => e.error === error)
    
    if (existing) {
      existing.frequency++
      existing.lastOccurrence = Date.now()
      if (suggestedFix) existing.suggestedFix = suggestedFix
    } else {
      memory.errorPatterns.push({
        error,
        frequency: 1,
        lastOccurrence: Date.now(),
        suggestedFix: suggestedFix || '',
      })
    }
    
    this.saveToStorage()
  }

  getRelevantContext(
    userId: string,
    sessionId: string,
    maxMessages: number = 10
  ): {
    recentMessages: Array<{ role: string; content: string }>
    preferredTools: string[]
    commonErrors: Array<{ error: string; suggestedFix: string }>
    successfulExperiments: string[]
  } {
    const memory = this.getOrCreateMemory(userId, sessionId)
    
    return {
      recentMessages: memory.messages.slice(-maxMessages),
      preferredTools: memory.userPreferences.preferredTools,
      commonErrors: memory.errorPatterns
        .filter(e => e.frequency > 2)
        .slice(0, 5)
        .map(e => ({ error: e.error, suggestedFix: e.suggestedFix })),
      successfulExperiments: memory.experimentPatterns
        .filter(p => p.successRate > 0.7)
        .slice(0, 5)
        .map(p => p.description),
    }
  }

  clearSession(userId: string, sessionId: string): void {
    const key = `${userId}:${sessionId}`
    this.memory.delete(key)
    this.saveToStorage()
  }

  clearAll(): void {
    this.memory.clear()
    localStorage.removeItem(MEMORY_STORAGE_KEY)
  }
}

// Singleton instance
export const aiMemory = new AiMemorySystem()
