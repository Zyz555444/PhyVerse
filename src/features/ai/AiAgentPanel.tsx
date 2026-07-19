import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  Settings,
  Loader2,
  Wrench,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Cpu,
  Square,
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
import { AGENT_TOOLS, executeTool } from './agentTools'
import { sendAiChat, fetchAiConfig } from './aiConfigApi'
import type { AiConfig } from './aiConfigTypes'
import type { AgentToolContext } from './agentTools'
import { getFriendlyName } from '@/features/sandbox/friendlyName'
import { saveScene } from '@/features/cloud/cloudApi'

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

export interface AiAgentPanelProps {
  onOpenSettings: () => void
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

export function AiAgentPanel({ onOpenSettings }: AiAgentPanelProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const isRunning = useSandboxStore((s) => s.isRunning)
  const gravity = useSandboxStore((s) => s.gravity)
  const timeScale = useSandboxStore((s) => s.editorConfig.timeScale)
  const addItem = useSandboxStore((s) => s.addItem)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)
  const setRunning = useSandboxStore((s) => s.setRunning)
  const resetScene = useSandboxStore((s) => s.resetScene)
  const selectItem = useSandboxStore((s) => s.selectItem)
  const setGravity = useSandboxStore((s) => s.setGravity)
  const clearScene = useSandboxStore((s) => s.clearScene)
  const requestImpulse = useSandboxStore((s) => s.requestImpulse)

  const measurementData = useSyncExternalStore(subscribeMeasurementData, getMeasurementData)

  const STORAGE_KEY = 'phyverse-ai-chat'
  const MAX_MESSAGES = 200

  function loadMessages(): Message[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.slice(-MAX_MESSAGES)
    } catch {
      return []
    }
  }

  function saveMessages(msgs: Message[]) {
    try {
      const trimmed = msgs.length > MAX_MESSAGES ? msgs.slice(-MAX_MESSAGES) : msgs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // localStorage full or unavailable
    }
  }

  function clearStoredMessages() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamedToolCallsRef = useRef<Record<number, ToolCallState>>({})

  // Persist messages to localStorage on every change
  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  // Abort any in-flight request when the panel unmounts (e.g. hidden or route change)
  useEffect(() => {
    return () => abortRef.current?.abort()
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
    ]
  )

  const systemPrompt = useMemo(
    () =>
      `你是 Phyverse AI Agent，一个物理沙盒实验助手。你可以通过工具调用直接操作沙盒环境、搭建模型、读取测量数据并回答用户问题。\n当前时间缩放：${timeScale}x。选中物体：${selectedId ? getFriendlyName(items, selectedId) : '无'}。`,
    [timeScale, selectedId, items]
  )

  const parseStreamChunk = (
    raw: string,
    toolCallsRef: React.MutableRefObject<Record<number, ToolCallState>>
  ): { content: string; toolCalls: ToolCallState[] } => {
    let content = ''
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta
        if (delta?.content) {
          content += delta.content
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallsRef.current[tc.index]
            if (existing) {
              existing.arguments += tc.function?.arguments ?? ''
            } else {
              toolCallsRef.current[tc.index] = {
                id: tc.id ?? `tool-${Date.now()}-${tc.index}`,
                name: tc.function?.name ?? '',
                arguments: tc.function?.arguments ?? '',
                status: 'pending',
              }
            }
          }
        }
      } catch {
        // ignore malformed lines
      }
    }
    return { content, toolCalls: Object.values(toolCallsRef.current) }
  }

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCallState[]) => {
      const results: Array<{ tool_call_id: string; role: 'tool'; content: string; name: string }> =
        []
      for (const call of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.arguments)
        } catch {
          // ignore
        }
        const result = await executeTool(call.name, args, toolContext)
        call.status = result.success ? 'success' : 'error'
        call.result = result.message
        results.push({
          tool_call_id: call.id,
          role: 'tool',
          content: result.message,
          name: call.name,
        })
      }
      return results
    },
    [toolContext]
  )

  const followUpWithToolResults = useCallback(
    async (
      currentMessages: Message[],
      originalConversation: { role: string; content: string }[],
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

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const { content, toolCalls: newToolCalls } = parseStreamChunk(
            buffer,
            streamedToolCallsRef
          )

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (!last || last.id !== followUpAssistant.id) return prev
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
        setError(raw.includes('Invalid JSON') ? 'AI 生成格式出错，请重试' : raw.slice(0, 120))
      }
    },
    [config]
  )

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return
    if (!config) {
      setError(t('ai.agent.configRequired'))
      return
    }

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

    const conversation = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage.content },
    ]

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const { content, toolCalls } = parseStreamChunk(buffer, streamedToolCallsRef)

        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (!last || last.role !== 'assistant') return prev
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content,
              toolCalls: toolCalls.length > 0 ? toolCalls : last.toolCalls,
            },
          ]
        })
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (!last || last.role !== 'assistant') return prev

        const finalToolCalls = streamedToolCallsRef.current
          ? Object.values(streamedToolCallsRef.current)
          : (last.toolCalls ?? [])
        const finalMessage = { ...last, isStreaming: false, toolCalls: finalToolCalls }

        if (finalToolCalls.length > 0) {
          executeToolCalls(finalToolCalls).then((toolResults) => {
            const toolResultMessages = toolResults.map((r) => ({
              id: `t-${r.tool_call_id}`,
              role: 'tool' as const,
              content: r.content,
            }))
            setMessages((current) => {
              const updated = [...current, ...toolResultMessages]
              // Re-engage AI with tool results for a natural follow-up
              followUpWithToolResults(updated, conversation, finalToolCalls, toolResults)
              return updated
            })
          })
        }

        return [...prev.slice(0, -1), finalMessage]
      })
    } catch (err) {
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
      if (friendly.length > 150) {
        friendly = friendly.slice(0, 150) + '...'
      }
      setError(friendly)
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
    } finally {
      setIsLoading(false)
      abortRef.current = null
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
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
              clearStoredMessages()
            }}
            title={t('ai.agent.clear')}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
              <motion.div
                key={message.id}
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
                  {message.content ||
                    (message.isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null)}

                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {message.toolCalls.map((call, idx) => (
                        <div
                          key={`${call.id}-${idx}`}
                          className="rounded-lg border border-border bg-paper px-2 py-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => toggleToolExpand(message.id)}
                            className="flex w-full items-center justify-between text-[10px]"
                          >
                            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                              <Wrench className="h-3 w-3" />
                              {call.name}
                              {call.status === 'pending' && (
                                <Loader2 className="h-3 w-3 animate-spin text-accent" />
                              )}
                              {call.status === 'success' && (
                                <span className="text-green-500">✓</span>
                              )}
                              {call.status === 'error' && <span className="text-danger">✗</span>}
                            </span>
                            {expandedTools[message.id] ? (
                              <ChevronUp className="h-3 w-3 text-text-tertiary" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-text-tertiary" />
                            )}
                          </button>
                          <AnimatePresence>
                            {expandedTools[message.id] && (
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
