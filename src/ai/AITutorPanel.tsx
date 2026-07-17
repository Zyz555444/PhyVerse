import { useState, useCallback, useEffect, useRef } from 'react'
import { Bot, X, Sparkles, RefreshCw, Send, ChevronRight } from 'lucide-react'
import {
  useSandboxStore,
  type SandboxItem,
  type SandboxJoint,
  type TelemetrySample,
} from '@/features/sandbox/sandboxStore'
import { analyzeScene, type AIInsight, type SceneAnalysis } from './ExperimentAnalyzer'
import { cn } from '@/shared/utils/cn'

export function AITutorPanel() {
  const [open, setOpen] = useState(false)
  const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])

  const items = useSandboxStore((s) => s.items)
  const joints = useSandboxStore((s) => s.joints)
  const gravity = useSandboxStore((s) => s.gravity)
  const telemetry = useSandboxStore((s) => s.telemetry.live)
  const simTime = useSandboxStore((s) => s.telemetry.simTime)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const runAnalysis = useCallback(() => {
    setLoading(true)
    // Simulate AI processing time
    setTimeout(() => {
      const result = analyzeScene(items, joints, gravity, telemetry, true, simTime)
      setAnalysis(result)
      setLoading(false)
    }, 500)
  }, [items, joints, gravity, telemetry, simTime])

  const initialAnalysisRef = useRef(false)
  useEffect(() => {
    if (open && !initialAnalysisRef.current) {
      initialAnalysisRef.current = true
      runAnalysis()
    }
  }, [open, runAnalysis])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }])

    // Generate a context-aware response
    setTimeout(() => {
      const response = generateChatResponse(userMsg, items, joints, gravity, telemetry, simTime)
      setChatMessages((prev) => [...prev, { role: 'ai', text: response }])
    }, 800)

    setChatInput('')
  }

  const insightTypeStyles: Record<AIInsight['type'], string> = {
    info: 'border-l-blue-500 bg-blue-50/50',
    warning: 'border-l-amber-500 bg-amber-50/50',
    success: 'border-l-green-500 bg-green-50/50',
    error: 'border-l-red-500 bg-red-50/50',
  }

  const insightIconStyles: Record<AIInsight['type'], string> = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
    error: 'text-red-600',
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-hover hover:shadow-xl"
        >
          <Bot className="h-4 w-4" />
          <span>AI 助手</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="pointer-events-auto fixed bottom-4 right-4 z-20 flex h-[500px] w-80 flex-col rounded-xl border border-border bg-paper shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-medium text-text-primary">AI 实验助手</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Analysis section */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">场景分析</span>
                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-accent hover:bg-accent-soft disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                  刷新
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-4 text-center">
                  <Sparkles className="h-4 w-4 animate-pulse text-accent" />
                  <span className="text-xs text-text-tertiary">正在分析场景...</span>
                </div>
              ) : analysis ? (
                <>
                  <p className="mb-2 text-xs text-text-secondary">{analysis.summary}</p>
                  <div className="space-y-1.5">
                    {analysis.insights.map((insight, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-lg border-l-2 px-3 py-2 transition-colors',
                          insightTypeStyles[insight.type]
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}
                          className="flex w-full items-center gap-1.5 text-left"
                        >
                          <ChevronRight
                            className={cn(
                              'h-3 w-3 flex-shrink-0 transition-transform',
                              insightIconStyles[insight.type],
                              expandedInsight === i && 'rotate-90'
                            )}
                          />
                          <span className="text-xs font-medium text-text-primary">
                            {insight.title}
                          </span>
                        </button>
                        {expandedInsight === i && (
                          <p className="mt-1 pl-4 text-xs text-text-secondary">{insight.detail}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="text-xs font-medium text-text-secondary">对话</span>
                <div className="mt-2 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-lg px-3 py-2 text-xs',
                        msg.role === 'user'
                          ? 'ml-6 bg-accent-soft text-accent'
                          : 'mr-6 bg-paper-tertiary text-text-primary'
                      )}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="向 AI 提问..."
                className="flex-1 rounded-lg border border-border bg-paper-tertiary px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function generateChatResponse(
  question: string,
  items: SandboxItem[],
  joints: SandboxJoint[],
  gravity: [number, number, number],
  telemetry: TelemetrySample | null,
  _simTime: number
): string {
  const q = question.toLowerCase()
  const gY = Math.abs(gravity[1])
  const dynamicItems = items.filter((it) => it.isDynamic)

  if (q.includes('重力') || q.includes('gravity') || q.includes('加速度')) {
    return `当前重力加速度设置为 ${gY.toFixed(2)} m/s²。地球表面标准重力加速度约为 9.81 m/s²。你可以通过属性面板调整重力参数。`
  }

  if (q.includes('能量') || q.includes('energy') || q.includes('动能') || q.includes('势能')) {
    if (telemetry) {
      return `当前追踪物体的动能约为 ${telemetry.ke.toFixed(2)} J，重力势能约为 ${telemetry.pe.toFixed(2)} J，总机械能约为 ${(telemetry.ke + telemetry.pe).toFixed(2)} J。在无摩擦的理想情况下，机械能守恒。`
    }
    return '请先运行实验并选中一个物体进行追踪，然后我可以为你分析能量变化。'
  }

  if (q.includes('弹簧') || q.includes('spring')) {
    const springs = joints.filter((j) => j.type === 'spring')
    if (springs.length > 0) {
      return `场景中有 ${springs.length} 个弹簧连接。弹簧遵循胡克定律 F = -kx，其中 k 为劲度系数，x 为形变量。振动周期 T = 2π√(m/k)。`
    }
    return '当前场景中没有弹簧连接。你可以选中两个物体，然后使用连接工具创建弹簧。'
  }

  if (q.includes('碰撞') || q.includes('collision')) {
    return `碰撞分为弹性碰撞（动能守恒）和非弹性碰撞（动能损失）。你可以通过属性面板调整物体的弹性系数（restitution）来控制碰撞类型。弹性系数为 1 时是完全弹性碰撞，为 0 时是完全非弹性碰撞。`
  }

  if (q.includes('摩擦') || q.includes('friction')) {
    return `摩擦力 = 摩擦系数 × 正压力。你可以通过属性面板调整每个物体的摩擦系数。摩擦系数越大，物体越难滑动。`
  }

  if (q.includes('单摆') || q.includes('pendulum') || q.includes('周期')) {
    const revoluteJoints = joints.filter((j) => j.type === 'revolute')
    if (revoluteJoints.length > 0) {
      return `单摆的周期公式为 T = 2π√(L/g)，其中 L 为摆长，g 为重力加速度。小角度摆动时周期与摆幅无关（等时性）。你可以用旋转关节连接物体来创建单摆。`
    }
    return '要创建单摆，请使用旋转关节（revolute）将一个物体连接到固定点。'
  }

  if (q.includes('斜面') || q.includes('slope') || q.includes('坡道')) {
    const slopes = items.filter((it) => it.shape === 'slope')
    if (slopes.length > 0) {
      return `物体在斜面上的加速度 a = g(sinθ - μcosθ)，其中 θ 为斜面角度，μ 为摩擦系数。无摩擦时 a = g·sinθ。`
    }
    return '请从器材库添加斜面（slope）器材，然后放置物体在斜面上观察运动。'
  }

  if (dynamicItems.length === 0) {
    return '当前场景中没有动态物体。请先从器材库添加一些物体，如小球、方块等，然后点击运行开始实验。'
  }

  return `这是一个很好的问题！基于当前场景（${dynamicItems.length} 个动态物体，${joints.length} 个连接），你可以尝试运行实验来观察物理现象。如有具体问题，可以继续问我关于重力、能量、碰撞、弹簧、摩擦等方面的问题。`
}
