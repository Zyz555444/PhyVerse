import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/shallow'
import {
  Bot,
  Send,
  Settings,
  Loader2,
  Wrench,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Cpu,
  Square,
  Plus,
  MessageSquare,
  Download,
  Trash2,
  Edit3,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import {
  getMeasurementData,
  subscribeMeasurementData,
} from '@/features/measurement/measurementDataStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer'
import { AGENT_TOOLS, executeTool } from './agentTools'
import { sendAiChat, fetchAiConfig } from './aiConfigApi'
import type { AiConfig } from './aiConfigTypes'
import type { AgentToolContext } from './agentTools'
import { getFriendlyName } from '@/features/sandbox/friendlyName'
import { saveScene } from '@/features/cloud/cloudApi'
import { aiMemory } from './aiMemory'
import { trimMessages } from './tokenBudget'
import { conversationManager, type Conversation } from './conversationManager'
import { exportConversationToMarkdown, downloadConversation } from './exportConversation'

interface ToolCallState {
  id: string
  name: string
  arguments: string
  result?: string
  status: 'pending' | 'success' | 'error'
}

interface Message {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCallState[]
  isStreaming?: boolean
}

// Memoized message component for performance optimization
const MessageComponent = React.memo(function MessageComponent({
  message,
  expanded,
  onToggleExpand,
}: {
  message: Message
  expanded: boolean
  onToggleExpand: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
          message.role === 'user'
            ? 'bg-accent text-white'
            : 'bg-paper-secondary text-accent'
        )}
      >
        {message.role === 'user' ? (
          <span className="text-xs font-bold">U</span>
        ) : message.role === 'tool' ? (
          <Wrench className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
          message.role === 'user'
            ? 'bg-accent text-white'
            : message.role === 'tool'
              ? 'border border-border bg-paper-secondary text-text-secondary'
              : 'border border-border bg-paper-secondary text-text-primary'
        )}
      >
        {message.content ? (
          <MarkdownRenderer content={message.content} />
        ) : message.isStreaming ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : null}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.toolCalls.map((call, idx) => (
              <div
                key={`${call.id}-${idx}`}
                className="rounded-lg border border-border bg-paper px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleExpand(message.id)}
                  className="flex w-full items-center justify-between text-[10px]"
                >
                  <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                    <Wrench className="h-3 w-3" />
                    {call.name}
                    {call.status === 'pending' && (
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                    )}
                    {call.status === 'success' && (
                      <span className="text-green-500">&#10003;</span>
                    )}
                    {call.status === 'error' && <span className="text-danger">&#10007;</span>}
                  </span>
                  {expanded ? (
                    <ChevronUp className="h-3 w-3 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-text-tertiary" />
                  )}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-1.5 whitespace-pre-wrap break-all rounded bg-paper-secondary p-1.5 text-[9px] text-text-tertiary">
                        {call.arguments}
                      </pre>
                      {call.result && (
                        <p className="mt-1 text-[9px] text-text-secondary">
                          {call.result}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export interface AiAgentPanelProps {
  onOpenSettings: () => void
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

export function AiAgentPanel({ onOpenSettings }: AiAgentPanelProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { items, selectedId, isRunning, gravity, editorConfig } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      selectedId: s.selectedId,
      isRunning: s.isRunning,
      gravity: s.gravity,
      editorConfig: s.editorConfig,
    })),
  )
  const timeScale = editorConfig.timeScale
  const addItem = useSandboxStore((s) => s.addItem)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const updateItem = useSandboxStore((s) => s.updateItem)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)
  const setRunning = useSandboxStore((s) => s.setRunning)
  const resetScene = useSandboxStore((s) => s.resetScene)
  const selectItem = useSandboxStore((s) => s.selectItem)
  const setGravity = useSandboxStore((s) => s.setGravity)
  const clearScene = useSandboxStore((s) => s.clearScene)
  const requestImpulse = useSandboxStore((s) => s.requestImpulse)

  const measurementData = useSyncExternalStore(subscribeMeasurementData, getMeasurementData)

  // Conversation management state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [showConvList, setShowConvList] = useState(false)
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingConvName, setEditingConvName] = useState('')

  // Load messages from active conversation
  const loadConversationMessages = useCallback((): Message[] => {
    const conv = conversationManager.getActive()
    if (!conv || conv.messages.length === 0) return []
    return conv.messages.map((m) => ({
      id: `h-${m.timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      role: m.role as Message['role'],
      content: m.content,
    }))
  }, [])

  const refreshConversations = useCallback(() => {
    setConversations(conversationManager.getAll())
    setActiveConvId(conversationManager.getActiveId())
  }, [])

  // Persist a message to conversationManager
  const persistMessage = useCallback((role: string, content: string) => {
    conversationManager.addMessage(role, content)
  }, [])

  // Initialize conversations
  useEffect(() => {
    const convs = conversationManager.getAll()
    if (convs.length === 0) {
      conversationManager.create()
    }
    refreshConversations()
  }, [refreshConversations])

  const [messages, setMessages] = useState<Message[]>(loadConversationMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamedToolCallsRef = useRef<Record<number, ToolCallState>>({})
  const activeRequestIdRef = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const pendingStreamUpdateRef = useRef<{
    content: string
    toolCalls: ToolCallState[]
  } | null>(null)
  const conversationRef = useRef<Array<{ role: string; content: string }>>([])

  // Abort any in-flight request when the panel unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      activeRequestIdRef.current = null
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchAiConfig()
      .then(({ config: cfg }) => setConfig(cfg))
      .catch(() => setConfig(null))
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Context awareness: record scene snapshots on significant changes
  const prevItemCountRef = useRef(items.length)
  const prevRunningRef = useRef(isRunning)
  useEffect(() => {
    if (!user) return
    const sessionId = activeConvId || 'default'

    if (Math.abs(items.length - prevItemCountRef.current) >= 2) {
      aiMemory.addSceneSnapshot(user.id, sessionId, items.length, gravity)
      prevItemCountRef.current = items.length
    }

    if (isRunning !== prevRunningRef.current) {
      if (isRunning) {
        aiMemory.addMessage(user.id, sessionId, 'system', `模拟开始运行，${items.length} 个物体`)
      }
      prevRunningRef.current = isRunning
    }
  }, [items.length, isRunning, gravity, user, activeConvId])

  const toolContext: AgentToolContext = useMemo(
    () => ({
      items,
      selectedId,
      isRunning,
      gravity,
      measurements: measurementData,
      actions: {
        addItem: (shape, position, patch) => addItem(shape, position, patch),
        run: () => setRunning(true),
        pause: () => setRunning(false),
        reset: () => resetScene(),
        setTimeScale: (scale) => setEditorConfig({ timeScale: Math.max(0.1, Math.min(scale, 5)) }),
        clearScene: () => clearScene(),
        selectItem: (id) => selectItem(id),
        setGravity: (g) => setGravity(g),
        applyImpulse: (id, impulse) => {
          requestImpulse(id, impulse)
        },
        saveScene: async (name, description) => {
          await saveScene({ name, description, data: { items, gravity } })
        },
        deleteItem: (id) => removeItem(id),
        updateItem: (id, patch) => updateItem(id, patch),
      },
    }),
    [
      items,
      selectedId,
      isRunning,
      gravity,
      measurementData,
      addItem,
      setRunning,
      resetScene,
      setEditorConfig,
      clearScene,
      selectItem,
      setGravity,
      requestImpulse,
      removeItem,
      updateItem,
    ]
  )

  const systemPrompt = useMemo(
    () => {
      const selectedName = selectedId ? getFriendlyName(items, selectedId) : '无'
      const objectCount = items.length
      const dynamicCount = items.filter(it => it.isDynamic).length
      const staticCount = objectCount - dynamicCount

      // Build memory context
      const memoryContext = (() => {
        if (!user) return ''
        const sessionId = activeConvId || 'default'
        const ctx = aiMemory.getRelevantContext(user.id, sessionId, 10)
        const parts: string[] = []

        if (ctx.preferredTools.length > 0) {
          parts.push(`- 常用工具: ${ctx.preferredTools.slice(-5).join(', ')}`)
        }
        if (ctx.successfulExperiments.length > 0) {
          parts.push(`- 成功实验模式: ${ctx.successfulExperiments.join(', ')}`)
        }
        if (ctx.commonErrors.length > 0) {
          parts.push(`- 需避免的错误:\n${ctx.commonErrors.map(e => `  · ${e.error} -> ${e.suggestedFix}`).join('\n')}`)
        }

        return parts.length > 0 ? `\n## 记忆上下文\n${parts.join('\n')}` : ''
      })()

      return `你是 Phyverse AI Agent，一个专业的物理沙盒实验助手。你的职责是帮助用户搭建物理模型、进行实验、分析数据并理解物理概念。

## 当前场景状态
- 物体总数: ${objectCount} (动态: ${dynamicCount}, 静态: ${staticCount})
- 重力加速度: [${gravity.join(', ')}] m/s²
- 时间缩放: ${timeScale}x
- 选中物体: ${selectedName}
- 模拟状态: ${isRunning ? '运行中' : '已暂停'}${memoryContext}

## 可用工具
你有 ${AGENT_TOOLS.length} 个工具可用，包括：
- 场景操作: 添加、删除、修改、复制物体
- 模拟控制: 运行、暂停、重置、设置时间缩放
- 物理设置: 设置重力、施加冲量/力、设置材料属性
- 测量分析: 获取场景信息、测量摘要、能量分析、距离/角度测量
- 知识查询: 查询物理公式、概念、实验方案 (query_physics_knowledge, search_formulas, search_concepts)
- 高级功能: 场景优化、运动预测、物理分析、代码导出

## 指导原则
1. **教育性**: 逐步引导用户理解物理概念，优先使用知识库工具查询准确的物理知识
2. **安全性**: 避免创建可能导致模拟崩溃的场景（如过多物体、极端参数）
3. **准确性**: 确保物理设置符合实际物理定律，使用知识库验证公式和概念
4. **实用性**: 优先使用最简洁有效的方法完成任务
5. **容错性**: 当工具执行失败时，提供替代方案或解释原因
6. **记忆利用**: 参考记忆上下文中的成功实验模式和常见错误，避免重复错误

## 错误处理
- 如果物体未找到，检查名称是否正确或使用 ID
- 如果参数无效，提供合理的默认值或建议范围
- 如果操作失败，解释原因并提供恢复建议

请用中文回答，保持专业、友好、教育性的语气。`
    },
    [timeScale, selectedId, items, gravity, isRunning, user, activeConvId]
  )

  const parseStreamChunk = (
    raw: string,
    toolCallsRef: React.MutableRefObject<Record<number, ToolCallState>>
  ): { content: string; toolCalls: ToolCallState[]; errors: string[] } => {
    let content = ''
    const errors: string[] = []
    const lines = raw.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta
        
        if (delta?.content && typeof delta.content === 'string') {
          content += delta.content
        }
        
        if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            if (!tc || typeof tc !== 'object') continue
            
            const index = typeof tc.index === 'number' ? tc.index : -1
            if (index < 0) continue
            
            const existing = toolCallsRef.current[index]
            if (existing) {
              if (tc.function?.arguments && typeof tc.function.arguments === 'string') {
                existing.arguments += tc.function.arguments
              }
              if (tc.function?.name && typeof tc.function.name === 'string' && !existing.name) {
                existing.name = tc.function.name
              }
            } else {
              toolCallsRef.current[index] = {
                id: tc.id ?? `tool-${Date.now()}-${index}`,
                name: tc.function?.name ?? '',
                arguments: tc.function?.arguments ?? '',
                status: 'pending',
              }
            }
          }
        }
      } catch (parseErr) {
        const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr)
        if (data.length > 0 && data !== '[DONE]') {
          errors.push(`Failed to parse stream chunk: ${errMsg.slice(0, 100)}`)
        }
      }
    }
    
    return { content, toolCalls: Object.values(toolCallsRef.current), errors }
  }

  // Safely parse JSON with tolerance for malformed AI output
  const safeJsonParse = (raw: string, toolName: string): Record<string, unknown> => {
    const trimmed = raw.trim()
    if (trimmed === '' || trimmed === '{}') return {}
    
    // Standard parse attempt
    try {
      return JSON.parse(trimmed)
    } catch {
      // Try to extract the first valid JSON object
      const firstBrace = trimmed.indexOf('{')
      if (firstBrace >= 0) {
        let depth = 0
        for (let i = firstBrace; i < trimmed.length; i++) {
          if (trimmed[i] === '{') depth++
          else if (trimmed[i] === '}') {
            depth--
            if (depth === 0) {
              try {
                return JSON.parse(trimmed.slice(firstBrace, i + 1))
              } catch {
                break
              }
            }
          }
        }
      }
      
      console.warn(`[AiAgentPanel] Could not parse tool arguments for ${toolName}, defaulting to {}`)
      return {}
    }
  }

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCallState[]) => {
      const results: Array<{ tool_call_id: string; role: 'tool'; content: string; name: string }> =
        []
      const maxRetries = 1
      
      for (const call of toolCalls) {
        let args: Record<string, unknown> = {}
        
        if (call.arguments && call.arguments.trim() !== '') {
          args = safeJsonParse(call.arguments, call.name)
        }
        
        // Execute tool with retry
        let lastError = ''
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const result = await executeTool(call.name, args, toolContext)
            call.status = result.success ? 'success' : 'error'
            call.result = result.message
            
            // Record tool usage in memory
            if (user) {
              const sessionId = activeConvId || 'default'
              aiMemory.recordToolUsage(user.id, sessionId, call.name)
              if (!result.success) {
                aiMemory.recordError(user.id, sessionId, result.message, `检查 ${call.name} 的参数是否正确`)
              }
            }
            
            results.push({
              tool_call_id: call.id,
              role: 'tool',
              content: result.message,
              name: call.name,
            })
            
            if (!result.success) {
              console.error(`[AiAgentPanel] Tool execution failed for ${call.name}:`, result.message)
            }
            break
          } catch (execErr) {
            lastError = execErr instanceof Error ? execErr.message : String(execErr)
            
            if (attempt < maxRetries) {
              console.warn(`[AiAgentPanel] Retrying tool ${call.name} (attempt ${attempt + 1}):`, lastError)
              await new Promise((r) => setTimeout(r, 500))
              continue
            }
            
            call.status = 'error'
            call.result = `工具执行异常(已重试${maxRetries}次): ${lastError.slice(0, 100)}`
            results.push({
              tool_call_id: call.id,
              role: 'tool',
              content: call.result,
              name: call.name,
            })
            console.error(`[AiAgentPanel] Tool execution exception for ${call.name}:`, execErr)
            
            if (user) {
              const sessionId = activeConvId || 'default'
              aiMemory.recordError(user.id, sessionId, lastError, `重试 ${call.name} 工具`)
            }
          }
        }
      }
      
      return results
    },
    [toolContext, user, activeConvId]
  )

  // Streaming throttle helper
  const flushStreamUpdate = useCallback(() => {
    if (pendingStreamUpdateRef.current) {
      const { content, toolCalls: newToolCalls } = pendingStreamUpdateRef.current
      pendingStreamUpdateRef.current = null
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (!last || last.role !== 'assistant') return prev
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content,
            toolCalls: newToolCalls.length > 0 ? newToolCalls : last.toolCalls,
          },
        ]
      })
    }
    rafIdRef.current = null
  }, [])

  const followUpWithToolResults = useCallback(
    async (
      currentMessages: Message[],
      originalConversation: Array<{ role: string; content: string }>,
      toolCalls: ToolCallState[],
      toolResults: Array<{ tool_call_id: string; role: string; content: string; name: string }>
    ) => {
      if (!config) return

      const assistantMessage = currentMessages[currentMessages.length - toolResults.length - 1]
      const followUpMessages = [
        ...originalConversation,
        {
          role: 'assistant',
          content: assistantMessage?.content ?? '',
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
          })),
        },
        ...toolResults.map((r) => ({
          role: 'tool' as const,
          tool_call_id: r.tool_call_id,
          content: r.content,
        })),
      ]

      abortRef.current = new AbortController()

      try {
        const response = await sendAiChat({
          messages: followUpMessages as Parameters<typeof sendAiChat>[0]['messages'],
          stream: true,
          temperature: 0.3,
          signal: abortRef.current.signal,
        })

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `AI request failed: ${response.status}`)
        }

        const followUpAssistant: Message = {
          id: `a-follow-${Date.now()}`,
          role: 'assistant',
          content: '',
          isStreaming: true,
        }
        setMessages((prev) => [...prev, followUpAssistant])

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        streamedToolCallsRef.current = {}

        let streamErrors: string[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const { content, toolCalls: newToolCalls, errors } = parseStreamChunk(
            buffer,
            streamedToolCallsRef
          )
          
          if (errors.length > 0) {
            streamErrors.push(...errors)
          }

          pendingStreamUpdateRef.current = { content, toolCalls: newToolCalls }
          if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(flushStreamUpdate)
          }
        }
        
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        flushStreamUpdate()
        
        if (streamErrors.length > 0) {
          console.warn('[AiAgentPanel] Stream parsing errors:', streamErrors.slice(0, 5))
        }

        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (!last || last.id !== followUpAssistant.id) return prev
          return [...prev.slice(0, -1), { ...last, isStreaming: false }]
        })
      } catch (err) {
        if (isAbortError(err)) {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'assistant' || !last.isStreaming) return prev
            if (!last.content) return prev.filter((m) => m.id !== last.id)
            return [...prev.slice(0, -1), { ...last, isStreaming: false }]
          })
          return
        }
        const raw = err instanceof Error ? err.message : String(err)
        console.error('Follow-up error:', raw)
        if (raw.includes('429') || raw.includes('rate') || raw.includes('limit')) {
          setError('AI 服务请求过于频繁，请等待几秒后重试')
        } else if (raw.includes('Invalid JSON')) {
          setError('AI 生成格式出错，请重试')
        } else {
          setError(raw.slice(0, 120))
        }
      }
    },
    [config, flushStreamUpdate]
  )

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return
    if (!config) {
      setError(t('ai.agent.configRequired'))
      return
    }

    if (activeRequestIdRef.current) {
      console.warn('[AiAgentPanel] Request already in progress, ignoring new request')
      return
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    activeRequestIdRef.current = requestId

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    }
    const assistantMessage: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)
    setError(null)
    streamedToolCallsRef.current = {}

    // Persist user message
    persistMessage('user', userMessage.content)
    if (user) {
      const sessionId = activeConvId || 'default'
      aiMemory.addMessage(user.id, sessionId, 'user', userMessage.content)
    }

    const fullConversation = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage.content },
    ]

    // Apply token budget trimming
    const conversation = trimMessages(fullConversation)
    conversationRef.current = conversation

    abortRef.current = new AbortController()

    try {
      const response = await sendAiChat({
        messages: conversation as Parameters<typeof sendAiChat>[0]['messages'],
        tools: AGENT_TOOLS.map((tool) => ({
          type: 'function',
          function: tool.function,
        })),
        stream: true,
        temperature: 0.3,
        signal: abortRef.current.signal,
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `AI request failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      let streamErrors: string[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const { content, toolCalls, errors } = parseStreamChunk(buffer, streamedToolCallsRef)
        
        if (errors.length > 0) {
          streamErrors.push(...errors)
        }

        // Throttle with rAF
        pendingStreamUpdateRef.current = { content, toolCalls }
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(flushStreamUpdate)
        }
      }
      
      // Flush final pending update
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      flushStreamUpdate()
      
      if (streamErrors.length > 0) {
        console.warn('[AiAgentPanel] Stream parsing errors:', streamErrors.slice(0, 5))
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (!last || last.role !== 'assistant') return prev

        const finalToolCalls = streamedToolCallsRef.current
          ? Object.values(streamedToolCallsRef.current)
          : (last.toolCalls ?? [])
        const finalContent = last.content || ''
        const finalMessage = { ...last, isStreaming: false, toolCalls: finalToolCalls }

        // Persist assistant message
        if (finalContent) {
          persistMessage('assistant', finalContent)
          if (user) {
            const sessionId = activeConvId || 'default'
            aiMemory.addMessage(user.id, sessionId, 'assistant', finalContent)
          }
        }

        if (finalToolCalls.length > 0) {
          executeToolCalls(finalToolCalls).then((toolResults) => {
            const toolResultMessages = toolResults.map((r) => ({
              id: `t-${r.tool_call_id}`,
              role: 'tool' as const,
              content: r.content,
            }))
            setMessages((current) => {
              const updated = [...current, ...toolResultMessages]
              followUpWithToolResults(updated, conversationRef.current, finalToolCalls, toolResults)
              return updated
            })
          })
        }

        return [...prev.slice(0, -1), finalMessage]
      })
    } catch (err) {
      if (activeRequestIdRef.current !== requestId) {
        console.warn('[AiAgentPanel] Ignoring error from stale request')
        return
      }
      
      if (isAbortError(err)) {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (!last || last.id !== assistantMessage.id) return prev
          if (!last.content) return prev.filter((m) => m.id !== assistantMessage.id)
          return [...prev.slice(0, -1), { ...last, isStreaming: false }]
        })
        return
      }
      const raw = err instanceof Error ? err.message : String(err)
        let friendly = raw
        // Detect rate limiting
        if (raw.includes('429') || raw.includes('rate') || raw.includes('limit')) {
          friendly = 'AI 服务请求过于频繁，请等待几秒后重试'
        } else {
          try {
            const parsed = JSON.parse(raw)
            if (parsed.error?.metadata?.raw) {
              const inner = JSON.parse(parsed.error.metadata.raw)
              friendly = inner.error?.message || parsed.error.message || raw
            } else if (parsed.error?.message) {
              friendly = parsed.error.message
            } else if (parsed.error) {
              friendly = String(parsed.error)
            }
          } catch {
            // not JSON, use raw string
          }
        }
      if (friendly.length > 150) {
        friendly = friendly.slice(0, 150) + '...'
      }
      setError(friendly)
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false)
        abortRef.current = null
        activeRequestIdRef.current = null
      }
    }
  }, [
    input,
    isLoading,
    user,
    config,
    t,
    systemPrompt,
    messages,
    executeToolCalls,
    followUpWithToolResults,
    persistMessage,
    flushStreamUpdate,
    activeConvId,
  ])

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  const toggleToolExpand = (messageId: string) => {
    setExpandedTools((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-paper-secondary p-6 text-center">
        <Bot className="h-10 w-10 text-text-tertiary" />
        <p className="text-sm text-text-secondary">{t('ai.agent.signInRequired')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-paper shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConvList((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-paper-secondary hover:text-text-primary transition-colors"
            title="对话列表"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-heading text-sm font-semibold text-text-primary">
              {t('ai.agent.title')}
            </h3>
            <p className="text-[10px] text-text-tertiary">
              {config ? `${config.provider} · ${config.model}` : t('ai.agent.noConfig')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              const exportMsgs = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .map((m) => ({ role: m.role, content: m.content, timestamp: Date.now() }))
              const markdown = exportConversationToMarkdown(exportMsgs)
              downloadConversation(markdown)
            }}
            disabled={messages.length === 0}
            title="导出对话"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onOpenSettings}
            title={t('ai.agent.settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setMessages([])
              conversationManager.clearActive()
              refreshConversations()
            }}
            title={t('ai.agent.clear')}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation list */}
      <AnimatePresence>
        {showConvList && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="max-h-48 overflow-y-auto px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  conversationManager.create()
                  setMessages([])
                  refreshConversations()
                  setShowConvList(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-accent hover:bg-accent-soft transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                新建对话
              </button>
              <div className="my-1 border-t border-border" />
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                    conv.id === activeConvId
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:bg-paper-secondary'
                  )}
                >
                  {editingConvId === conv.id ? (
                    <input
                      type="text"
                      value={editingConvName}
                      onChange={(e) => setEditingConvName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          conversationManager.rename(conv.id, editingConvName)
                          setEditingConvId(null)
                          refreshConversations()
                        } else if (e.key === 'Escape') {
                          setEditingConvId(null)
                        }
                      }}
                      onBlur={() => {
                        if (editingConvName.trim()) {
                          conversationManager.rename(conv.id, editingConvName)
                        }
                        setEditingConvId(null)
                        refreshConversations()
                      }}
                      className="flex-1 rounded border border-border bg-paper px-2 py-0.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        conversationManager.switchTo(conv.id)
                        setMessages(loadConversationMessages())
                        refreshConversations()
                        setShowConvList(false)
                      }}
                      className="flex-1 truncate text-left text-xs"
                    >
                      {conv.name}
                    </button>
                  )}
                  {conv.id === activeConvId && !editingConvId && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingConvId(conv.id)
                          setEditingConvName(conv.name)
                        }}
                        className="rounded p-0.5 text-text-tertiary hover:text-text-primary"
                        title="重命名"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (conversations.length <= 1) return
                          conversationManager.delete(conv.id)
                          setMessages(loadConversationMessages())
                          refreshConversations()
                        }}
                        disabled={conversations.length <= 1}
                        className="rounded p-0.5 text-text-tertiary hover:text-danger disabled:opacity-30"
                        title="删除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="px-3 py-2 text-[10px] text-text-tertiary text-center">暂无对话</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <Bot className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t('ai.agent.welcome')}</p>
              <p className="mt-1 max-w-[220px] text-xs text-text-secondary">{t('ai.agent.hint')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                t('ai.agent.quickBuildRamp'),
                t('ai.agent.quickEnergy'),
                t('ai.agent.quickRun'),
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickAction(prompt)}
                  className="rounded-full border border-border bg-paper-secondary px-3 py-1 text-[10px] text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageComponent
                key={message.id}
                message={message}
                expanded={expandedTools[message.id] || false}
                onToggleExpand={toggleToolExpand}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error / Status */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border px-4 py-2"
          >
            <div className="flex items-center gap-2 rounded-lg bg-danger/5 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-danger" />
              <span className="flex-1 text-xs text-danger">{error}</span>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  handleSend()
                }}
                className="rounded-md px-2 py-0.5 text-xs font-medium text-danger hover:bg-danger/10"
              >
                {t('ai.agent.retry')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder={t('ai.agent.inputPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isLoading || !config}
            className="flex-1"
          />
          {isLoading ? (
            <Button
              variant="secondary"
              onClick={() => abortRef.current?.abort()}
              className="px-3"
              title={t('ai.agent.stop')}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!input.trim() || !config} onClick={handleSend} className="px-3">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!config && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[10px] text-accent hover:underline"
          >
            <Cpu className="h-3 w-3" />
            {t('ai.agent.configureNow')}
          </button>
        )}
      </div>
    </div>
  )
}
