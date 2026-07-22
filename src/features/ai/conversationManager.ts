/**
 * Multi-conversation management for the AI agent.
 * Supports creating, switching, renaming, and deleting conversations.
 */

export interface Conversation {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  messages: Array<{ role: string; content: string; timestamp: number }>
  toolCalls: Array<{ name: string; args: Record<string, unknown>; result: string; timestamp: number }>
}

const STORAGE_KEY = 'phyverse-ai-conversations'
const ACTIVE_CONV_KEY = 'phyverse-ai-active-conv'
const MAX_CONVERSATIONS = 20
const MAX_MESSAGES_PER_CONV = 200

class ConversationManager {
  private conversations: Map<string, Conversation> = new Map()
  private activeId: string | null = null
  private loaded = false

  private load(): void {
    if (this.loaded) return
    this.loaded = true

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const conv of parsed) {
            if (conv && conv.id) {
              this.conversations.set(conv.id, conv as Conversation)
            }
          }
        }
      }
      this.activeId = localStorage.getItem(ACTIVE_CONV_KEY)
    } catch {
      // Ignore load errors
    }
  }

  private save(): void {
    try {
      const arr = Array.from(this.conversations.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
      if (this.activeId) {
        localStorage.setItem(ACTIVE_CONV_KEY, this.activeId)
      }
    } catch {
      // Ignore save errors
    }
  }

  private generateId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  private generateName(): string {
    const count = this.conversations.size + 1
    return `对话 ${count}`
  }

  getAll(): Conversation[] {
    this.load()
    return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getActive(): Conversation | null {
    this.load()
    if (this.activeId) {
      return this.conversations.get(this.activeId) ?? null
    }
    return null
  }

  getActiveId(): string | null {
    this.load()
    return this.activeId
  }

  create(name?: string): Conversation {
    this.load()
    const conv: Conversation = {
      id: this.generateId(),
      name: name || this.generateName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      toolCalls: [],
    }
    this.conversations.set(conv.id, conv)
    this.activeId = conv.id

    // Limit total conversations
    if (this.conversations.size > MAX_CONVERSATIONS) {
      const all = this.getAll()
      const toRemove = all.slice(MAX_CONVERSATIONS)
      for (const c of toRemove) {
        this.conversations.delete(c.id)
      }
    }

    this.save()
    return conv
  }

  switchTo(id: string): Conversation | null {
    this.load()
    const conv = this.conversations.get(id)
    if (conv) {
      this.activeId = id
      this.save()
      return conv
    }
    return null
  }

  rename(id: string, name: string): boolean {
    this.load()
    const conv = this.conversations.get(id)
    if (conv && name.trim()) {
      conv.name = name.trim()
      conv.updatedAt = Date.now()
      this.save()
      return true
    }
    return false
  }

  delete(id: string): boolean {
    this.load()
    const deleted = this.conversations.delete(id)
    if (deleted && this.activeId === id) {
      // Switch to the most recent remaining conversation
      const remaining = this.getAll()
      if (remaining.length > 0) {
        this.activeId = remaining[0].id
      } else {
        this.activeId = null
      }
    }
    this.save()
    return deleted
  }

  addMessage(role: string, content: string): void {
    this.load()
    const conv = this.getActive()
    if (!conv) {
      const newConv = this.create()
      newConv.messages.push({ role, content, timestamp: Date.now() })
      newConv.updatedAt = Date.now()
    } else {
      conv.messages.push({ role, content, timestamp: Date.now() })
      conv.updatedAt = Date.now()
      if (conv.messages.length > MAX_MESSAGES_PER_CONV) {
        conv.messages = conv.messages.slice(-MAX_MESSAGES_PER_CONV)
      }
    }
    this.save()
  }

  getMessagesForAi(): Array<{ role: string; content: string }> {
    this.load()
    const conv = this.getActive()
    if (!conv) return []
    return conv.messages.map((m) => ({ role: m.role, content: m.content }))
  }

  clearActive(): void {
    this.load()
    if (this.activeId) {
      const conv = this.conversations.get(this.activeId)
      if (conv) {
        conv.messages = []
        conv.toolCalls = []
        conv.updatedAt = Date.now()
      }
    }
    this.save()
  }
}

export const conversationManager = new ConversationManager()
